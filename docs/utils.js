  var row_num = 0;
  var con_num = 0;
  var timestamps = [];

  function drawHistv0()
  {
	  var data = [
		  ["Photofeed", 990],
		  ["Geba", 962],
		  ["Zoomcast", 955],
		  ["Wikivu", 955],
		  ["Oyoloo", 953],
		  ["Vipe", 934],
		  ["Rhynyx", 930],
	  ];

	  // set the dimensions and margins of the graph
	  var margin = {
		  top: 10,
		  right: 30,
		  bottom: 30,
		  left: 40
	  },
		  width = 360 - margin.left - margin.right,
		  height = 300 - margin.top - margin.bottom;

	  // append the svg object to the body of the page

	  var svg = d3.select("#my_dataviz")
		  .append("svg")
		  .attr("width", width + margin.left + margin.right)
		  .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		  .attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

	  // X axis: scale and draw:
	  var x = d3.scaleLinear()
		  .domain([0, 1000]) // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
		  .range([0, width]);
	  svg.append("g")
		  .attr("transform", "translate(0," + height + ")")
		  .call(d3.axisBottom(x));

	  // set the parameters for the histogram
	  var histogram = d3.histogram()
		  .value(function(d) {
			  return d[1]; // <-- HERE it used to say d.price
		  }) // I need to give the vector of value
		  .domain(x.domain()) // then the domain of the graphic
		  .thresholds(x.ticks(70)); // then the numbers of bins

	  // And apply this function to data to get the bins
	  var bins = histogram(data);

	  // Y axis: scale and draw:
	  var y = d3.scaleLinear()
		  .range([height, 0]);
	  y.domain([0, d3.max(bins, function(d) {
		  return d.length;
	  })]); // d3.hist has to be called before the Y axis obviously
	  svg.append("g")
		  .call(d3.axisLeft(y));

	  // append the bar rectangles to the svg element
	  svg.selectAll("rect")
		  .data(bins)
		  .enter()
		  .append("rect")
		  .attr("x", 1)
		  .attr("transform", function(d) {
			  return "translate(" + x(d.x0) + "," + y(d.length) + ")";
		  })
		  .attr("width", function(d) {
			  return x(d.x1) - x(d.x0);
		  })
		  .attr("height", function(d) {
			  return height - y(d.length);
		  })
		  .style("fill", "#69b3a2")
  }


  function drawHist()
  {
	  var formattedDates = timestamps.map(function(ts) {
		  return new Date(ts);
	  });

	  console.log(timestamps)
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

	  d3.select('svg').remove();
	  
	  // append the svg object to the body of the page
	  var svg = d3.select("#my_dataviz")
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

	  let title = "Histogram of Events/Occurrence"
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
	  const reader = new FileReader();
	  reader.onload = handleFileLoad;
	  reader.readAsText(event.target.files[0]);
  }

  function handleFileLoad(event) {
	  // console.log(event);
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

  
