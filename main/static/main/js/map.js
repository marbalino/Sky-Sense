// Sky Sense Interactive Map
class SkySenseMap {
    constructor() {
        this.map = null;
        this.layers = {
            sensors: L.layerGroup(),
            creeks: L.layerGroup(),
            sewers: L.layerGroup(),
            storms: L.layerGroup()
        };
        this.defaultView = [37.875, -122.265];
        this.defaultZoom = 14;
        this.init();
    }

    init() {
        this.initMap();
        this.loadGISData();
        this.setupControls();
        this.addSensorData();
        this.createLiveSensorCards();
        this.startLiveUpdates();
    }

    initMap() {
        // Initialize the map with Sky Sense styling
        this.map = L.map('skysense-map', { 
            renderer: L.canvas(),
            zoomControl: false // We'll add our own controls
        }).setView(this.defaultView, this.defaultZoom);

        // Add zoom event listener to control label visibility
        this.map.on('zoomend', () => {
            this.updateLabelVisibility();
        });

        // Add custom zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Add base layer with Sky Sense theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Sky Sense Environmental Monitoring'
        }).addTo(this.map);

        // Add default layers - all layers visible by default
        this.layers.sensors.addTo(this.map);
        this.layers.creeks.addTo(this.map);
        this.layers.sewers.addTo(this.map);
        this.layers.storms.addTo(this.map);
        
        // Set initial label visibility
        setTimeout(() => this.updateLabelVisibility(), 100);
    }

    async loadGISData() {
        try {
            // Load creeks
            await this.loadCreeks();
            // Load sewer mains
            await this.loadSewerMains();
            // Load storm drains
            await this.loadStormDrains();
        } catch (error) {
            console.warn('Some GIS data could not be loaded:', error);
        }
    }

    async loadCreeks() {
        try {
            const response = await fetch('/sky-sense/static/main/gis/creeks.geojson');
            if (response.ok) {
                const data = await response.json();
                L.geoJSON(data, {
                    style: {
                        color: '#2E86C1',
                        weight: 3,
                        opacity: 0.9
                    },
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.crk_name) {
                            layer.bindTooltip(`${feature.properties.crk_name} Creek`, {
                                permanent: false,
                                direction: 'center',
                                className: 'creek-tooltip'
                            });
                        }
                    }
                }).addTo(this.layers.creeks);
            }
        } catch (error) {
            console.warn('Could not load creeks data:', error);
        }
    }

    async loadSewerMains() {
        try {
            const response = await fetch('/sky-sense/static/main/gis/sewer-mains.geojson');
            if (response.ok) {
                const data = await response.json();
                L.geoJSON(data, {
                    style: {
                        color: '#5a5a5a',
                        weight: 2,
                        opacity: 0.7
                    },
                    onEachFeature: (feature, layer) => {
                        layer.bindTooltip('Sewer Main', {
                            permanent: false,
                            direction: 'center',
                            className: 'sewer-tooltip'
                        });
                    }
                }).addTo(this.layers.sewers);
            }
        } catch (error) {
            console.warn('Could not load sewer mains data:', error);
        }
    }

    async loadStormDrains() {
        try {
            const response = await fetch('/sky-sense/static/main/gis/storm-drains.json');
            if (response.ok) {
                const data = await response.json();
                L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 3,
                            fillColor: '#e76f51',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    },
                    onEachFeature: (feature, layer) => {
                        layer.bindTooltip('Storm Drain', {
                            permanent: false,
                            direction: 'center',
                            className: 'storm-tooltip'
                        });
                    }
                }).addTo(this.layers.storms);
            }
        } catch (error) {
            console.warn('Could not load storm drains data:', error);
        }
    }

    addSensorData() {
        const sensorInfo = [
            { name: 'South Fork 2', coords: [37.870278, -122.259750], siteId: 'south_fork_2' },
            { name: 'North Fork 0', coords: [37.873667, -122.261750], siteId: 'north_fork_0' },
            { name: 'North Fork 1', coords: [37.872444, -122.262056], siteId: 'scnf010' },
            { name: 'South Fork 3', coords: [37.871028, -122.263417], siteId: 'south_fork_3' },
            { name: 'South Fork 1', coords: [37.871444, -122.257278], siteId: 'south_fork_1' },
            { name: 'South Fork 0', coords: [37.872250, -122.255278], siteId: 'south_fork_0' },
            { name: 'Kingman Hall', coords: [37.877043, -122.257500], siteId: 'kingman_hall' },
            { name: 'University House', coords: [37.8744, -122.261], siteId: 'university_house' },
            { name: 'Oxford Street', coords: [37.871, -122.265], siteId: 'oxford' },
            { name: 'Codornices Creek', coords: [37.883, -122.294], siteId: 'codornices' }
        ];

        sensorInfo.forEach(sensor => {
            const marker = L.marker(sensor.coords, {
                icon: this.createSensorIcon()
            });

            marker.bindTooltip(sensor.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -15],
                className: 'sensor-tooltip'
            });

            // Store reference for zoom-based visibility
            marker.sensorData = sensor;

            marker.on('click', () => {
                this.showSensorData(sensor);
            });

            marker.addTo(this.layers.sensors);
            
            // Store marker reference for label control
            if (!this.sensorMarkers) this.sensorMarkers = [];
            this.sensorMarkers.push(marker);
        });
    }

    updateLabelVisibility() {
        const currentZoom = this.map.getZoom();
        const showLabels = currentZoom >= 13; // Show labels at zoom level 13 and above
        
        if (this.sensorMarkers) {
            this.sensorMarkers.forEach(marker => {
                const tooltip = marker.getTooltip();
                if (tooltip) {
                    if (showLabels) {
                        tooltip.options.permanent = true;
                        marker.openTooltip();
                    } else {
                        tooltip.options.permanent = false;
                        marker.closeTooltip();
                    }
                }
            });
        }
    }

    createSensorIcon() {
        return L.divIcon({
            html: `<div class="sensor-marker">
                     <div class="sensor-pulse"></div>
                     <div class="sensor-dot"></div>
                   </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: 'custom-sensor-icon'
        });
    }

    async showSensorData(sensor) {
        const dashboard = document.getElementById('sensor-dashboard');
        const dashboardContent = dashboard.querySelector('.dashboard-content');
        
        dashboard.classList.add('active');
        dashboardContent.innerHTML = '<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading sensor data...</div>';

        try {
            // Simulate API call - replace with actual endpoint
            const response = await this.fetchSensorData(sensor.siteId);
            const html = this.renderSensorData(sensor, response);
            dashboardContent.innerHTML = html;
        } catch (error) {
            dashboardContent.innerHTML = `
                <div class="error-text">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load data for ${sensor.name}</p>
                    <small>This is a demo - integrate with your actual sensor API</small>
                </div>`;
        }
    }

    async fetchSensorData(siteId) {
        try {
            // Get the last 7 days of data
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const endTime = now.toISOString();
            const startTime = sevenDaysAgo.toISOString();
            const vars = 'Meter_Hydros21_Cond,Meter_Hydros21_Depth,Meter_Hydros21_Temp,EnviroDIY_Mayfly_Batt';
            
            const url = `/sky-sense/api/creek-data/?site=${siteId}&start=${startTime}&end=${endTime}&vars=${vars}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                // Get the latest reading
                const latest = data[data.length - 1];
                
                return {
                    temperature: latest.Meter_Hydros21_Temp != null ? Number(latest.Meter_Hydros21_Temp).toFixed(1) : 'N/A',
                    conductivity: latest.Meter_Hydros21_Cond != null ? Number(latest.Meter_Hydros21_Cond).toFixed(0) : 'N/A',
                    depth: latest.Meter_Hydros21_Depth != null ? Number(latest.Meter_Hydros21_Depth).toFixed(1) : 'N/A',
                    battery: latest.EnviroDIY_Mayfly_Batt != null ? Number(latest.EnviroDIY_Mayfly_Batt).toFixed(2) : 'N/A',
                    lastReading: latest.DateTimeUTC || new Date().toISOString()
                };
            } else {
                // No data available
                return {
                    temperature: 'No Data',
                    conductivity: 'No Data',
                    depth: 'No Data',
                    battery: 'No Data',
                    lastReading: 'No recent data'
                };
            }
        } catch (error) {
            console.error(`Error fetching data for ${siteId}:`, error);
            // Return error state
            return {
                temperature: 'Error',
                conductivity: 'Error',
                depth: 'Error',
                battery: 'Error',
                lastReading: 'Connection error'
            };
        }
    }

    renderSensorData(sensor, data) {
        return `
            <div class="sensor-info">
                <h5>${sensor.name}</h5>
                <div class="sensor-metrics">
                    <div class="metric">
                        <i class="fas fa-thermometer-half"></i>
                        <span class="label">Temperature</span>
                        <span class="value">${data.temperature}°C</span>
                    </div>
                    <div class="metric">
                        <i class="fas fa-tint"></i>
                        <span class="label">Conductivity</span>
                        <span class="value">${data.conductivity} µS/cm</span>
                    </div>
                    <div class="metric">
                        <i class="fas fa-ruler-vertical"></i>
                        <span class="label">Water Depth</span>
                        <span class="value">${data.depth} mm</span>
                    </div>
                    <div class="metric">
                        <i class="fas fa-battery-three-quarters"></i>
                        <span class="label">Battery</span>
                        <span class="value">${data.battery}V</span>
                    </div>
                </div>
                <div class="last-reading">
                    <i class="fas fa-clock"></i>
                    Last reading: ${new Date(data.lastReading).toLocaleString()}
                </div>
            </div>
        `;
    }

    setupControls() {
        // Layer toggle controls
        document.getElementById('toggle-sensors').addEventListener('change', (e) => {
            this.toggleLayer('sensors', e.target.checked);
        });
        
        document.getElementById('toggle-creeks').addEventListener('change', (e) => {
            this.toggleLayer('creeks', e.target.checked);
        });
        
        document.getElementById('toggle-sewers').addEventListener('change', (e) => {
            this.toggleLayer('sewers', e.target.checked);
        });
        
        document.getElementById('toggle-storms').addEventListener('change', (e) => {
            this.toggleLayer('storms', e.target.checked);
        });

        // Map action controls
        document.getElementById('reset-view').addEventListener('click', () => {
            this.map.setView(this.defaultView, this.defaultZoom);
        });

        document.getElementById('locate-user').addEventListener('click', () => {
            this.locateUser();
        });

        // Dashboard close button
        document.getElementById('close-dashboard').addEventListener('click', () => {
            document.getElementById('sensor-dashboard').classList.remove('active');
        });
    }

    toggleLayer(layerName, show) {
        if (show) {
            this.layers[layerName].addTo(this.map);
        } else {
            this.map.removeLayer(this.layers[layerName]);
        }
    }

    locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.map.setView([lat, lng], 16);
                    
                    L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: '<div class="user-location"><i class="fas fa-crosshairs"></i></div>',
                            iconSize: [20, 20],
                            className: 'user-location-marker'
                        })
                    }).addTo(this.map)
                      .bindPopup('Your location')
                      .openPopup();
                },
                () => {
                    alert('Could not determine your location');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser');
        }
    }

    createLiveSensorCards() {
        const dashboard = document.getElementById('live-sensor-dashboard');
        if (!dashboard) return;
        
        // Set up panel toggle functionality
        this.setupPanelToggle();

        // Get sensor info from our existing data
        const sensorInfo = [
            { name: 'South Fork 2', coords: [37.870278, -122.259750], siteId: 'south_fork_2' },
            { name: 'North Fork 0', coords: [37.873667, -122.261750], siteId: 'north_fork_0' },
            { name: 'North Fork 1', coords: [37.872444, -122.262056], siteId: 'scnf010' },
            { name: 'South Fork 3', coords: [37.871028, -122.263417], siteId: 'south_fork_3' },
            { name: 'South Fork 1', coords: [37.871444, -122.257278], siteId: 'south_fork_1' },
            { name: 'South Fork 0', coords: [37.872250, -122.255278], siteId: 'south_fork_0' },
            { name: 'Kingman Hall', coords: [37.877043, -122.257500], siteId: 'kingman_hall' },
            { name: 'University House', coords: [37.8744, -122.261], siteId: 'university_house' },
            { name: 'Oxford Street', coords: [37.871, -122.265], siteId: 'oxford' },
            { name: 'Codornices Creek', coords: [37.883, -122.294], siteId: 'codornices' }
        ];

        sensorInfo.forEach(sensor => {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            card.id = `card-${sensor.siteId}`;
            card.innerHTML = `
                <div class="sensor-card-header">
                    <h5><i class="fas fa-broadcast-tower"></i> ${sensor.name}</h5>
                    <div class="sensor-status online">
                        <i class="fas fa-circle"></i> LIVE
                    </div>
                </div>
                <div class="sensor-readings">
                    <div class="reading">
                        <i class="fas fa-thermometer-half"></i>
                        <span class="label">Temperature</span>
                        <span class="value" id="${sensor.siteId}-temp">Loading...</span>
                    </div>
                    <div class="reading">
                        <i class="fas fa-tint"></i>
                        <span class="label">Conductivity</span>
                        <span class="value" id="${sensor.siteId}-cond">Loading...</span>
                    </div>
                    <div class="reading">
                        <i class="fas fa-ruler-vertical"></i>
                        <span class="label">Water Depth</span>
                        <span class="value" id="${sensor.siteId}-depth">Loading...</span>
                    </div>
                    <div class="reading">
                        <i class="fas fa-battery-three-quarters"></i>
                        <span class="label">Battery</span>
                        <span class="value" id="${sensor.siteId}-batt">Loading...</span>
                    </div>
                </div>
                <div class="last-update">
                    <i class="fas fa-clock"></i>
                    <span id="${sensor.siteId}-timestamp">Updating...</span>
                </div>
            `;
            dashboard.appendChild(card);

            // Add click handler to scroll to sensor on map
            card.addEventListener('click', () => {
                this.map.setView(sensor.coords, 16);
                // Flash the corresponding sensor marker
                this.flashSensorMarker(sensor.siteId);
            });
        });
    }

    startLiveUpdates() {
        // Update sensor data immediately
        this.updateAllSensorData();
        
        // Set interval to update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateAllSensorData();
        }, 30000);
    }

    async updateAllSensorData() {
        const sensorInfo = [
            { name: 'South Fork 2', siteId: 'south_fork_2' },
            { name: 'North Fork 0', siteId: 'north_fork_0' },
            { name: 'North Fork 1', siteId: 'scnf010' },
            { name: 'South Fork 3', siteId: 'south_fork_3' },
            { name: 'South Fork 1', siteId: 'south_fork_1' },
            { name: 'South Fork 0', siteId: 'south_fork_0' },
            { name: 'Kingman Hall', siteId: 'kingman_hall' },
            { name: 'University House', siteId: 'university_house' },
            { name: 'Oxford Street', siteId: 'oxford' },
            { name: 'Codornices Creek', siteId: 'codornices' }
        ];

        sensorInfo.forEach(async sensor => {
            try {
                const data = await this.fetchSensorData(sensor.siteId);
                this.updateSensorCard(sensor.siteId, data);
            } catch (error) {
                console.error(`Error updating ${sensor.name}:`, error);
                this.updateSensorCard(sensor.siteId, null);
            }
        });
    }

    updateSensorCard(siteId, data) {
        // Update status indicator based on data
        const statusElement = document.querySelector(`#card-${siteId} .sensor-status`);
        const statusIcon = statusElement ? statusElement.querySelector('i') : null;
        
        if (!data) {
            // Handle error case
            const elements = ['temp', 'cond', 'depth', 'batt'];
            elements.forEach(type => {
                const element = document.getElementById(`${siteId}-${type}`);
                if (element) element.textContent = 'Error';
            });
            const timestamp = document.getElementById(`${siteId}-timestamp`);
            if (timestamp) timestamp.textContent = 'Connection error';
            
            // Update status to offline
            if (statusElement) {
                statusElement.className = 'sensor-status offline';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> ERROR';
            }
            return;
        }
        
        // Check if we have recent valid data
        const hasRecentData = data.lastReading !== 'No recent data' && data.lastReading !== 'Connection error';
        const hasValidReadings = data.temperature !== 'No Data' && data.temperature !== 'Error';
        
        if (statusElement) {
            if (hasRecentData && hasValidReadings) {
                statusElement.className = 'sensor-status online';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> LIVE';
            } else if (hasRecentData && !hasValidReadings) {
                statusElement.className = 'sensor-status warning';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> PARTIAL';
            } else {
                statusElement.className = 'sensor-status offline';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> OFFLINE';
            }
        }

        // Update temperature
        const tempElement = document.getElementById(`${siteId}-temp`);
        if (tempElement) tempElement.textContent = `${data.temperature}°C`;

        // Update conductivity
        const condElement = document.getElementById(`${siteId}-cond`);
        if (condElement) condElement.textContent = `${data.conductivity} µS/cm`;

        // Update depth
        const depthElement = document.getElementById(`${siteId}-depth`);
        if (depthElement) depthElement.textContent = `${data.depth} mm`;

        // Update battery
        const battElement = document.getElementById(`${siteId}-batt`);
        if (battElement) battElement.textContent = `${data.battery}V`;

        // Update timestamp
        const timestampElement = document.getElementById(`${siteId}-timestamp`);
        if (timestampElement) {
            if (data.lastReading === 'No recent data' || data.lastReading === 'Connection error') {
                timestampElement.textContent = data.lastReading;
            } else {
                const lastReading = new Date(data.lastReading);
                timestampElement.textContent = `Last reading: ${lastReading.toLocaleString()} UTC`;
            }
        }
    }

    flashSensorMarker(siteId) {
        // This would flash the corresponding marker on the map
        // Implementation would depend on how markers are stored and referenced
        console.log(`Flashing marker for ${siteId}`);
    }
    
    setupPanelToggle() {
        const toggleBtn = document.getElementById('toggle-panel');
        const panel = document.getElementById('integrated-sensor-panel');
        
        // Ensure panel is not minimized on mobile by default
        if (window.innerWidth <= 768 && panel) {
            panel.classList.remove('minimized');
        }
        
        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('minimized');
                const icon = toggleBtn.querySelector('i');
                const isMobile = window.innerWidth <= 768;
                
                if (panel.classList.contains('minimized')) {
                    if (isMobile) {
                        icon.className = 'fas fa-chevron-down';
                    } else {
                        icon.className = 'fas fa-chevron-right';
                    }
                } else {
                    if (isMobile) {
                        icon.className = 'fas fa-chevron-up';
                    } else {
                        icon.className = 'fas fa-chevron-left';
                    }
                }
            });
            
            // Update icon on window resize
            window.addEventListener('resize', () => {
                const icon = toggleBtn.querySelector('i');
                const isMobile = window.innerWidth <= 768;
                const isMinimized = panel.classList.contains('minimized');
                
                if (isMinimized) {
                    if (isMobile) {
                        icon.className = 'fas fa-chevron-down';
                    } else {
                        icon.className = 'fas fa-chevron-right';
                    }
                } else {
                    if (isMobile) {
                        icon.className = 'fas fa-chevron-up';
                    } else {
                        icon.className = 'fas fa-chevron-left';
                    }
                }
            });
        }
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('skysense-map')) {
        window.skySenseMap = new SkySenseMap();
    }
});