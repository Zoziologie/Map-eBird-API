
//import location from './location.json'


var markersLayer, app
window.onload = function () {
	
	app = new Vue({
		delimiters: ["((", "))"],
		el: '#ff',
		data: {
			base: 'data',
			layer: "recent",
			regionCode: '',
			speciesCode: '',
			notable: true,
			date:"",
			locId:"",
			subId:"",
			key:"",
			lat: "",
			lng: "",
			speciesGrouping : 'eBird',
			regionType : "country",
			parentRegionCode : "world",
			back: '14',
			cat:'',
			hotspot:false,
			includeProvisional:false,
			maxResults: 10000,
			r:'',
			sppLocale:"en",
			structure: {},
			locations: [],
			species: [],
		},
		mounted  () {
			var self = this;
			$.getJSON('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/structure.json', 
			function (json) {
				/*Object.keys(json).forEach(e =>{
					json[e][items] = json[e][items] || {};
					json[e][optional] = json[e][optional] || {};
					json[e][parms] = json[e][parms] || {};
				})*/
				self.structure = json;
			})
			$.getJSON('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/location.json', 
			function (json) {
				self.locations = json.map(l => { 
					return { text: l[1], value: l[0] } 
				});
			})
			$.getJSON('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/species.json', 
			function (json) {
				self.species = json.map(l => { return { text: l[2], value: l[1] } });
			})
		},
		computed: {
			base_opts: function(){
				return Object.keys(this.structure)
			},
			layer_opts: function(){
				return Object.keys(this.structure).length>0 ? Object.keys(this.structure[this.base]) : [];
			},
			clayer: function () {
				return Object.keys(this.structure).length>0 ? this.structure[this.base][this.layer] : []
			}
		},
		methods: {
			generateLink: function(event){
				var url = this.base+'/'+this.layer+'/';
				url += eval(this.structure[this.base][this.layer]['url'])
				url += '?key=' + this.key;
				$('#parms').val(url)
			},
			exportURL: function (type, e) {
				console.log(type)
				var url = 'https://api.ebird.org/v2/' + jQuery('#parms').val();
				if (type == 'mapit'){
					jQuery(e.target).html('<i class="fa fa-spinner fa-spin"></i> Loading')
					jQuery.getJSON( url , function(data){
						geojsonFeature = {
							"type": "FeatureCollection",
							"features": data.map(d=>{
								return {
									"type": "Feature",
									"properties": d,
									"geometry": {
										"type": "Point",
										"coordinates": [d.lng, d.lat]
									}
								}
							})
						}
						geojsonL = L.geoJSON(geojsonFeature,{
							onEachFeature: function (feature, layer) {
								table = Object.keys(feature.properties).map(p =>{
									return '<b>'+p+'</b>: '+feature.properties[p]
								}).join('<br>')
								layer.bindPopup(table);
							}
						})
						markersLayer.addLayer(geojsonL);
						map.flyToBounds(geojsonL.getBounds(),{paddingTopLeft:[0, 48]});
						dates = data.map(d=>{ 
							return new Date(d.obsDt)
						})
						var maxDate=new Date(Math.max.apply(null,dates));
						var minDate=new Date(Math.min.apply(null,dates));
						jQuery('#mapit').html('<i class="fas fa-globe"></i> Map it!')
						
					})
					.fail(function( jqxhr, textStatus, error ) {
						jQuery('#mapit').html('<i class="fas fa-globe"></i> Map it!')
						var err = textStatus + ", " + error;
						alert( "Request Failed: " + err +'<br>Check that the url is valid and that the key is added.');
					});
					
				} else if (type=="downloadit"){
					window.open(url);
				}
			},
			helpBase: function(){
				window.open(this.structure[this.base][this.layer]['doc']);
			},
			getlatlng: function(){
				var drawMarkerLocation = new L.Draw.Marker(map);
				drawMarkerLocation.enable();
			},
			setlatlng: function(){
				var loc = e.layer.getLatLng()
				this.lat = loc.Lat;
				this.lng = loc.Lng;
			}
		}
	})
	
	
	// Map
	map = new L.Map('map1').setView(L.latLng(0, 0), 2);
	baseLayers = {
		'MapBox': L.tileLayer.provider('MapBox', {id: 'mapbox.light', accessToken:token.mapbox}).addTo(map),
		'Mapbox Sattelite' : L.tileLayer.provider('MapBox', {id: 'mapbox.satellite', accessToken:token.mapbox}),
		'OpenStreetMap' : L.tileLayer.provider('OpenStreetMap.Mapnik'),
		'OpenStreetMap': L.tileLayer.provider('OpenStreetMap.Mapnik'),
	};
	markerLocation = new L.FeatureGroup().addTo(map);
	
	control = L.control.layers(baseLayers, null, {collapsed: true}).addTo(map);
	markersLayer = L.markerClusterGroup().addTo(map);
	

	
	/*new L.Control.Draw({
		position: 'topright',
		draw: {
			polyline: false,
			polygon: false,
			circle: false,
			circlemarker: false,
			rectangle: true, 
			marker: {
				icon: L.AwesomeMarkers.icon({
					icon: 'list',
					prefix: 'fa'
				})
			}
		},
		edit: {
			featureGroup: markerLocation
		}
	}).addTo(map)*/
	map.on('draw:created', function (e) {
		markerLocation.clearLayers();
		markerLocation.addLayer(e.layer)
		app.setlatlng(e)
	})
	
} 














/*
$sel_loc = jQuery('#sel-loc').selectize({
	valueField: 'code',
	labelField: 'name',
	searchField: ['name'],
	onChange: function(value){
	}
});
sel_loc  = $sel_loc[0].selectize;
jQuery.get('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/location.json',function(data) {
sel_loc.addOption(data.map(d => {
	return {
		name: d[1],
		code: d[0]
	}
}))
sel_loc.updatePlaceholder()
});


$sel_spe = jQuery('#sel-spe').selectize({
	valueField: 'code',
	labelField: 'name',
	searchField: ['name','code'],
	onChange: function(value){
	}
});
sel_spe  = $sel_spe[0].selectize;
jQuery.get('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/species.json',function(data) {
sel_spe.addOption(data.map(d => {
	return {
		name: d[2],
		code: d[1],
		cat: d[0]
	}
}).unshift())
sel_spe.updatePlaceholder()
});
*/
