var row_num = 0;
var con_num = 0;
var timestamps = [];
var reader = new FileReader();  
var event_table_keys = [];
var startup_timestamps = [];
let interested_event_strings = [
	["imx6", "find", "camera_app", "firmware_version", ""],
	["CameraApp", "swirscan", "","", "error"],
	["CameraApp", "find", "", "darkcal", "error"],
	["fpga check status error"],
];

var startDate = "";
var endDate = "";

var realEventsData = []

function getLinearlySpacedDates(startDateStr, endDateStr, numDates) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Calculate the interval in milliseconds
    var interval;
	var num = numDates;
	if(numDates==0)
	{
		interval = 86400000;
		num = (endDate - startDate)/interval + 1;
	} else
	{
		interval = (endDate - startDate) / (numDates - 1);
	}
		
    const dates = [];
    for (let i = 0; i < num; i++) {
        const newDate = new Date(startDate.getTime() + i * interval);
        dates.push(newDate.toISOString().split('T')[0]);
    }

    return dates;
}

function drawHist()
{
	drawHistogram(timestamps, "#my_dataviz", "Histogram of Events/Occurrence");	
}

function drawStartupHist()
{
	drawHistogram(startup_timestamps, "#startup_dataviz", "Histogram of Startup");	
}

function drawScatterTest()
{
	// var endDateValue = document.getElementById('endDate').value;
	// [year, month, day] = endDateValue.split("-");
	// endDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"
	
	// var startDateValue = document.getElementById('startDate').value;
	// var [year, month, day] = startDateValue.split("-");
	// startDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"

	var event = new Event('change');
	document.getElementById('csvFile').dispatchEvent(event);
	console.log("start date:"+ startDate)
	dates = getLinearlySpacedDates(startDate, endDate, 0);
	console.log("sampled dates:"+dates);
	// drawScatter(simulatedData, dates, "#scatter_dataviz", "Events ScatterPlot");
	drawScatter(realEventsData, dates, "#scatter_dataviz", "Events ScatterPlot");
}



function getMax(a){
  return Math.max(...a.map(e => Array.isArray(e) ? getMax(e) : e));
}


// general concept
// 
// x -  timeframe 
// y -  event percentage now, maybe in future use expected fail rate (Poisson rate)
// circle center - fail rate estimation for specific error 
// circle radius - fail counts of specific error 
//
function drawScatter(input_data, label_array, div_id, title)
{
		var margin = {
		top: 30,
		right: 30,
		bottom: 50,
		left: 50
	},
		width = 360 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	d3.select(div_id).select("svg").remove();

	// colors
	var color = d3.scaleOrdinal()
		.range(["#EFB605", "#E58903", "#E01A25", "#C20049", "#991C71", "#66489F", "#2074A0", "#10A66E", "#7EB852"])
		.domain(["fpga status error", "swirscan error", "darkcal error", " motor error", 
				 "voltage error", "data error", "TEC error", "panhome error",  "restart"]);

	// append the svg object to the body of the page
	var svg = d3.select(div_id)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			  "translate(" + margin.left + "," + margin.top + ")");

	svg.append('text')
		.attr('class', 'title')
		.attr('y', -10)
		.text(title);

	var x = d3.scaleBand()
		.range([ 0, width ])
		.domain(label_array)


	var interval = ~~(label_array.length/5)
	
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%interval)})))
		.selectAll("text")
		.attr("transform", "translate(-10,0)rotate(-45)")
		.style("text-anchor", "end");


	var y = d3.scaleLinear()
		.range([height, 0]);
	y.domain(d3.extent(input_data, function(d) { return d.rate; })); 
	
	svg.append("g")
		.call(d3.axisLeft(y));
	
	var yScale = d3.scaleLinear()
	.range([height,0])
	.domain(d3.extent(input_data, function(d) { return d.rate; }))
		.nice();
	
	var rScale = d3.scaleSqrt()
		.range([ 2,  16])
		.domain(d3.extent(input_data, function(d) { return d.count; }));
	
	svg.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("transform", "translate(-35,25)rotate(-90)")
		.text("Err/Event Percentage");

	// legend
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 160,
		legendHeight = 270;

	d3.select("#legend").select("svg").remove();
	var svgLegend = d3.select("#legend").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));			

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");
		
	var rectSize = 16, //dimensions of the colored square
		rowHeight = 22, //height of a row in the legend
		maxWidth = 125; //widht of each row
		  
	//Create container per rect/text pair  
	var legend = legendWrapper.selectAll('.legendSquare')  	
			  .data(color.range())                              
			  .enter().append('g')   
			  .attr('class', 'legendSquare') 
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; });
	 
	//Append small squares to Legend
	legend.append('rect')                                     
		  .attr('width', rectSize) 
		  .attr('height', rectSize) 			  		  
		  .style('fill', function(d) {return d;});                                 
	//Append text to Legend
	legend.append('text')                                     
		  .attr('transform', 'translate(' + 25 + ',' + (rectSize/2) + ')')
		  .attr("class", "legendText")
		  .style("font-size", "11px")
		  .attr("dy", ".35em")		  
		  .text(function(d,i) { return color.domain()[i]; });  
	
	
	svg.selectAll("countries")
	.data(input_data) //Sort so the biggest circles are below
	.enter().append("circle")
		.style("opacity", false)
		.style("fill", function(d) {return color(d.eventClass);})
		.attr("cx", d => x(d.date))
		.attr("cy", d => yScale(d.rate))
		.attr("r", d =>  rScale(d.count))

}

function drawHistogram(ts_in, div_id, title)
{
	var formattedDates = ts_in.map(function(ts) {
		return new Date(ts);
	});

	var svg_id = div_id+"_svg"
	
	var countsByYearMonth = {};
	formattedDates.forEach(function(date) {
		var year = date.getFullYear();
		var month = date.getMonth() + 1; // Add 1 to match human-readable months (1-12)
		var key = year + "-" + (month < 10 ? "0" : "") + month; // Format as "YYYY-MM"

		if (!countsByYearMonth[key]) {
			countsByYearMonth[key] = 1;
		} else {
			countsByYearMonth[key]++;
		}
	});

	console.log("keys:"+Object.keys(countsByYearMonth))
	console.log(Object.values(countsByYearMonth))
	console.log(Object.entries(countsByYearMonth))
	let arr = Object.entries(countsByYearMonth);
	var mapped = arr.map(d => {
		return {
			date: d[0],
			count: d[1]
		}
	});
	console.log(mapped);
	// set the dimensions and margins of the graph
	var margin = {
		top: 30,
		right: 30,
		bottom: 40,
		left: 40
	},
		width = 360 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	d3.select(div_id).select("svg").remove();
	

	// append the svg object to the body of the page
	var svg = d3.select(div_id)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			  "translate(" + margin.left + "," + margin.top + ")");

	// X axis
	var x = d3.scaleBand()
		.range([ 0, width ])
		.domain(Object.keys(countsByYearMonth))
		.padding(0.2);
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))
		.selectAll("text")
		.attr("transform", "translate(-10,0)rotate(-45)")
		.style("text-anchor", "end");

	// Add Y axis
	var y = d3.scaleLinear()
		.range([height, 0]);
	y.domain([0, d3.max(mapped, function(d) {
		return d.count;
	})]); // d3.hist has to be called before the Y axis obviously

	svg.append("g")
		.call(d3.axisLeft(y));

	svg.append('text')
		.attr('class', 'title')
		.attr('y', -10)
		.text(title);

	svg.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("transform", "translate(-30,25)rotate(-90)")
		.text("Counts");
	
	svg.selectAll("mybar")
		.data(mapped)
		.enter()
		.append("rect")
		.attr("x", d => x(d.date))
		.attr("y", function(d) { return y(d.count); })
		.attr("width", x.bandwidth())
		.attr("height", function(d) { return height - y(d.count); })
		.attr("fill", "#69b3a2")
	
}


function init(){

	document.getElementById('endDate').valueAsDate = new Date();
	var endDateValue = document.getElementById('endDate').value;
	[year, month, day] = endDateValue.split("-");
	endDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"
	console.log("endDate:"+endDate)

	
	document.getElementById('startDate').valueAsDate = new Date("2024-01-01");
	var startDateValue = document.getElementById('startDate').value;
	var [year, month, day] = startDateValue.split("-");
	startDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"
	console.log("startDate:"+startDate)
	
	document.getElementById('csvFile').addEventListener('change', handleFileSelect, false);
	// Set the minimum date for the end date input
	document.getElementById('startDate').addEventListener('change', () => {
		startDateValue = document.getElementById('startDate').value;
		[year, month, day] = startDateValue.split("-");
		startDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"
		console.log("startDate:"+startDate)
	});

	document.getElementById('endDate').addEventListener('change', () => {
		endDateValue = document.getElementById('endDate').value;
		[year, month, day] = endDateValue.split("-");
		endDate = year + "-"  + month +"-"+day; // Format as "YYYY-MM"
		console.log("endDate:"+endDate)
	});

	// const endDateInput = document.getElementById('endDate');

	console.log("start parsing");
}

function handleFileSelect(event) {
	console.log("file selected");
	// const reader = new FileReader();
	reader.onload = function(e){
		handleFileLoad(e);
		d3ParseFile(e);
	}
	reader.readAsText(event.target.files[0]);
}

function handleFileLoad(event) {
	// document.getElementById('fileContent').textContent = event.target.result;
	// console.info( '. . got: ', event.target.result.length, event );
	const csvData = event.target.result;
	const parsedData = parseCSVData(csvData);
	// console.log(parsedData.data[1][0])
	// console.log(parsedData.meta)
	
	for(let i = 1; i<row_num-1; i++)
	{
		timestamps.push(parsedData.data[i][1])
	}
}

function d3ParseFile(){
    var doesColumnExist = false;
    var data = d3.csvParse(reader.result, function(d){
        doesColumnExist = d.hasOwnProperty("someColumn");
        return d;   
    });
    console.log(doesColumnExist);
	const [dataValues] = d3.values(data)
	const keys = Object.keys(dataValues)
	event_table_keys = keys;
	console.log("d3parsed:"+keys);
	console.log("d3parse:"+data)
	// loop over events
	var date_cur = data[0].RowKey.substring(0,10);
	var restart_cnt = 0;
	var swir_err_cnt = 0;
	var darkcal_err_cnt = 0;
	var fpgastatus_err_cnt = 0;
	var volt_err_cnt = 0;
	var tec_err_cnt = 0;
	var data_err_cnt = 0;
	var total_events_cnt = 0;
	console.log("date_cur:"+date_cur)
	realEventsData = [];
	for(i=0;i<data.length;i++)
	{
		if(data[i].RowKey<startDate)
			continue;
		if(data[i].Subject=="imx6" && data[i].Verb == "find" && data[i].Object=="firmware_version" && data[i].Callee=="camera_app")
			startup_timestamps.push(data[i].RowKey);

		if(data[i].RowKey.substring(0,10) == date_cur)
		{
			total_events_cnt++;
			if(data[i].Subject=="imx6" && data[i].Verb == "find" && data[i].Object=="firmware_version" && data[i].Callee=="camera_app")
				restart_cnt++;
			if(data[i].Subject=="FPGA" && data[i].Verb == "swirscan" && data[i].Status=="error")
				swir_err_cnt++;
			if(data[i].Subject=="CameraApp" && data[i].Verb == "find" && data[i].Object=="darkcal" && data[i].Status=="error")
				darkcal_err_cnt++;
			if(data[i].Subject=="FPGA" && data[i].Verb == "check" && data[i].Object=="status" && data[i].Status=="error")
				fpgastatus_err_cnt++;
			if(data[i].Subject=="CameraApp" && data[i].Verb == "find" && data[i].Object=="voltage" && data[i].Status=="error")
				volt_err_cnt++;

			if(data[i].Subject=="FPGA" && data[i].Verb == "find" && data[i].Object=="tec_temperature" && data[i].Status=="error")
				tec_err_cnt++;
			if( data[i].Object=="data" && data[i].Status=="error")
				data_err_cnt++;
		} else
		{
			if(restart_cnt!=0)
			{
				realEventsData.push({"eventClass":"restart", "rate":restart_cnt/total_events_cnt, "date":date_cur, "count":restart_cnt});
			}

			if(swir_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"swirscan error", "rate":swir_err_cnt/total_events_cnt, "date":date_cur, "count":swir_err_cnt});
			}

			if(darkcal_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"darkcal error", "rate":darkcal_err_cnt/total_events_cnt, "date":date_cur, "count":darkcal_err_cnt});
			}

			if(fpgastatus_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"fpga status error", "rate":fpgastatus_err_cnt/total_events_cnt, "date":date_cur, "count":fpgastatus_err_cnt});
			}

			if(volt_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"voltage error", "rate":volt_err_cnt/total_events_cnt, "date":date_cur, "count":volt_err_cnt});
			}

			if(tec_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"TEC error", "rate":tec_err_cnt/total_events_cnt, "date":date_cur, "count":tec_err_cnt});
			}
			if(data_err_cnt!=0)
			{
				realEventsData.push({"eventClass":"data error", "rate":data_err_cnt/total_events_cnt, "date":date_cur, "count":data_err_cnt});
			}

			
			date_cur = data[i].RowKey.substring(0,10);
			restart_cnt = 0;
			swir_err_cnt = 0;
			darkcal_err_cnt = 0;
			fpgastatus_err_cnt = 0;
			volt_err_cnt = 0;
			tec_err_cnt = 0;
			data_err_cnt = 0;
			total_events_cnt = 0;

		}
	}

	// {"eventClass":"restart",
	 // "count":23,
	 // "rate": 0.75,
	 // "date":"2024-01-15"},

	// console.log("d3parsed row 1:"+data[1])
	console.log("d3parsed startups:"+startup_timestamps)
	
}

function parseCSVData(csvData) {
    // Implement your CSV parsing logic (e.g., using a library like Papa Parse)
    // Return the parsed data as an array of arrays or objects
    // Example: return Papa.parse(csvData).data;
	timestamps = [];
	return Papa.parse(csvData, {
		complete: function(results) {
			row_num = results.data.length;
			col_num = results.data[0].length;
			// console.log(row_num, col_num);
        } 
	});
}



var simulatedData = [
	{"eventClass":"restart",
	 "count":23,
	 "rate": 0.75,
	 "date":"2024-01-15"},
	{"eventClass":"swirscan error",
	 "count":11,
	 "rate":0.13,
	 "date":"2024-06-23"},
	{"eventClass":"restart",
	 "count":99,
	 "rate":0.82,
	 "date":"2024-07-01"},
	{"eventClass":"darkcal error",
	 "count":299,
	 "rate":0.32,
	 "date":"2024-04-01"}

	
];

var countries = [
  {
    "Country": "Afghanistan",
    "CountryCode": "AFG",
    "Region": "Asia | South & West",
    "Continent": "Asia",
    "GDP": 15936784437.22,
    "GDP_perCapita": 561.2,
    "lifeExpectancy": 59.60009756
  },
	{
    "Country": "Afghanistan",
    "CountryCode": "AFG",
    "Region": "Asia | South & West",
    "Continent": "Asia",
    "GDP": 15936784437.22,
    "GDP_perCapita": 56100.2,
    "lifeExpectancy": 59.60009756
  },

  {
    "Country": "Albania",
    "CountryCode": "ALB",
    "Region": "Europe | South & East",
    "Continent": "Europe",
    "GDP": 11926957254.63,
    "GDP_perCapita": 4094.36,
    "lifeExpectancy": 76.9785122
  },
  {
    "Country": "Algeria",
    "CountryCode": "DZA",
    "Region": "Africa | North & East",
    "Continent": "Africa",
    "GDP": 161207304960.46,
    "GDP_perCapita": 4349.57,
    "lifeExpectancy": 70.61660976
  },
  {
    "Country": "Angola",
    "CountryCode": "AGO",
    "Region": "Africa | South & West",
    "Continent": "Africa",
    "GDP": 82470894868.33,
    "GDP_perCapita": 4218.65,
    "lifeExpectancy": 50.65417073
  },
  {
    "Country": "Antigua and Barbuda",
    "CountryCode": "ATG",
    "Region": "America | North & Central",
    "Continent": "Americas",
    "GDP": 1135539037.04,
    "GDP_perCapita": 13017.31,
    "lifeExpectancy": 75.33390244
  },]
