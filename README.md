# I am so cold!

*This site is an academic exercise with little practical application.*

## The requirements:
	1. I am tired of this cold weather, where is the closest place I can go that is at least 72º, and how do I get there?
	2. Use Forecast.io and Leaflet APIs.

A user enters their origin latitude, longitude, and desired temperature. When they click the button, places.json is parsed and the distance in miles to each "place" is calculated and pushed into an array, after which the array is sorted by distance.

Beginning with the closest place, the site requests current weather information from Forecast.io. The result is checked to see if the maximum daily temperature is greater than the desired temperature. If not, the next place is checked. When the place that's checked's temperature is greater to or equal than the desired temperature, a route to the origin location to that destination is drawn on a map using the Leaflet API.

The checked places that have temperatures below the desired are listed for the convenience of the user, with relevant distance and temperature information.

## Future enhancements

1. Map pin would show the place's temperature and a popup might display the name of the place.
2. Input field would geocode enabled so the user wouldn't have to use esoteric latitude and longitude values.
3. Form validation for acceptable values, not just numbers.
5. Select list for the temperature field.