var row_num = 0;
var con_num = 0;
var timestamps = [];
var reader = new FileReader();  
var event_table_keys = [];
var startup_timestamps = [];


function drawHist()
{
	drawHistogram(timestamps, "#my_dataviz", "Histogram of Events/Occurrence");	
}

function drawStartupHist()
{
	drawHistogram(startup_timestamps, "#startup_dataviz", "Histogram of Startup");	
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

	console.log(Object.keys(countsByYearMonth))
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
	document.getElementById('csvFile').addEventListener('change', handleFileSelect, false);
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
	// console.log("d3parsed:"+keys);
	// console.log("d3parse:"+data)
	// loop over events
	for(i=0;i<data.length;i++)
	{
		if(data[i].Subject=="imx6" && data[i].Verb == "find" && data[i].Object=="firmware_version" && data[i].Callee=="camera_app")
			startup_timestamps.push(data[i].RowKey)
	}
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


