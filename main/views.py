from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import requests
import json

def index(request):
    return render(request, 'index.html')

def embud_map(request):
    return render(request, 'embud-map.html')

def team(request):
    return render(request, 'team.html')

def creek_data_proxy(request):
    """Proxy API calls to Strawberry Creek to avoid CORS issues"""
    try:
        # Get parameters from request
        site = request.GET.get('site')
        start = request.GET.get('start')
        end = request.GET.get('end')
        vars = request.GET.get('vars')
        
        if not all([site, start, end, vars]):
            return JsonResponse({'error': 'Missing required parameters'}, status=400)
        
        # Build the Strawberry Creek API URL
        strawberry_api_url = f"https://www.strawberrycreek.org/api/creek-data/?site={site}&start={start}&end={end}&vars={vars}"
        
        # Make the request server-side
        response = requests.get(strawberry_api_url, timeout=10)
        
        if response.status_code == 200:
            # Return the JSON data
            return JsonResponse(response.json(), safe=False)
        else:
            return JsonResponse({'error': f'API returned status {response.status_code}'}, status=response.status_code)
            
    except requests.RequestException as e:
        return JsonResponse({'error': f'Request failed: {str(e)}'}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
