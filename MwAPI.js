
//import location from './location.json'


var markersLayer, app
var now = new Date

/* PREPARE FOR COOKIES*/
var later = new Date();
later.setTime(later.getTime() + (365*24*60*60*1000));
var expires = "expires="+ later.toUTCString();
cookies_input=['url','base','layer','regionCode','specieCode','lat','lng','notable','date','key'];

function getCookieValue(a) {
	var b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
	return b ? decodeURIComponent(b.pop()) : '';
}



window.onload = function () {
	
	Vue.component('v-select', VueSelect.VueSelect);
	
	app = new Vue({
		delimiters: ["((", "))"],
		el: '#ff',
		data: {
			base: 'data',
			layer: "obs",
			regionCode: 'France',
			speciesCode: '',
			notable: true,
			date: now.toISOString().split('T')[0],
			locId:"",
			subId:"",
			key:"",
			lat: "",
			lng: "",
			speciesGrouping : 'eBird',
			regionType : "country",
			parentRegionCode : "world",
			back: 14,
			cat: '',
			hotspot:false,
			includeProvisional:false,
			maxResults: 10000,
			r:'',
			sppLocale:"en",
			sort:"date",
			detail: "simple",
			rank: "mrec",
			url: '',
			structure: {},
			locations: [],
			species: [],
		},
		mounted  () {
			var self = this;
			$.getJSON('https://zoziologie.raphaelnussbaumer.com/assets/Map-eBird-API/structure.json', 
			function (json) {
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
			cookies_input.forEach(function(s){
				var v = getCookieValue(s);
				if (!(v === "")){
					self[s] = v
				}
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
				if (Object.keys(this.structure).length==0){
					return []
				} else{
					var tmp =this.structure[this.base][this.layer];
					return (typeof tmp == 'undefined') ? [] : tmp
				}
			}
		},
		methods: {
			generateLink: function(event){
				app.url = eval(this.structure[this.base][this.layer]['url'])

				cookies_input.forEach(function(s){
					document.cookie= s + "=" + encodeURIComponent(app[s]) + ";" + expires + ";path=/";
				})
			},
			helpBase: function(){
				window.open(this.structure[this.base][this.layer]['doc']);
			},
			getlatlng: function(){
				var drawMarkerLocation = new L.Draw.Marker(map);
				drawMarkerLocation.enable();
			},
			setlatlng: function(e){
				var loc = e.layer.getLatLng();
				this.lat = loc.lat;
				this.lng = loc.lng;
			},
			exportURL: function (type, e) {
				if (type=="toJSON"){
					window.open('https://api.ebird.org/v2/' + app.url);
				} else if (type == 'toCSV'){
					jQuery(e.target.parentElement.parentElement.previousSibling).html('<i class="fa fa-spinner fa-spin"></i> Loading')
					jQuery.getJSON( 'https://api.ebird.org/v2/' + app.url , function(json){
						var fields = Object.keys(json[0])
						var replacer = function(key, value) { return value === null ? '' : value } 
						var csv = json.map(function(row){
							return fields.map(function(fieldName){
								return JSON.stringify(row[fieldName], replacer)
							}).join(',')
						})
						csv.unshift(fields.join(',')) // add header column
						csv = 'data:text/csv;charset=utf-8,' + csv.join('\r\n');

						var link = document.createElement("a");
						link.setAttribute("href", encodeURI(csv));
						link.setAttribute("download", "my_data.csv");
						document.body.appendChild(link); // Required for FF
						link.click();
						jQuery(e.target.parentElement.parentElement.previousSibling).html('<i class="fas fa-globe"></i> Download')
					})
				} else if (type == 'map'){
					jQuery(e.target).html('<i class="fa fa-spinner fa-spin"></i> Loading')
					jQuery.getJSON( 'https://api.ebird.org/v2/' + app.url , function(data){
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
						jQuery(e.target).html('<i class="fas fa-globe"></i> Map')
						
					})
					.fail(function( jqxhr, textStatus, error ) {
						jQuery(e.target).html('<i class="fas fa-globe"></i> Map')
						var err = textStatus + ", " + error;
						alert( "Request Failed: " + err +'<br>Check that the url is valid and that the key is added.');
					});
				}
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
