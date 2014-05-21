// Chart variables
var currentAltitude = 29;
var labels_chart1   = [];
var labels_chart2   = [];
var labels_chart3   = [];
var labels_chart5   = [];
var data_chart1     = [];
var data_chart2     = [];
var data_chart3_1   = [];
var data_chart3_2   = [];
var data_chart5_1   = [];
var data_chart5_2   = [];

var chart1_color = {
                        fillColor : "rgba(151,187,205,0.4)",
                        strokeColor : "rgba(151,187,205,1)",
                        pointColor : "rgba(151,187,205,1)"
                   };

var chart2_color = {
                        fillColor : "rgba(186, 125, 86, 0.3)",
                        strokeColor : "rgb(208, 128, 92)",
                        pointColor : "rgb(221, 98, 60)"
                   };  

// socket.io
var socket = io.connect('http://www.simplicity.be:3000');


/**
 * On Resize event
 **/
$(window).on('resize', function() {
    
    drawLineChart ("chart_1",labels_chart1, data_chart1, chart1_color, false);
    drawLineChart ("chart_2",labels_chart2, data_chart2, chart2_color, false);
    drawRadarChart("chart_3",labels_chart3, data_chart3_1, data_chart3_2, chart1_color, chart2_color);
    drawBarChart("chart_4",labels_chart3, data_chart3_1, data_chart3_2, chart1_color, chart2_color);
    drawBarChart("chart_5",labels_chart5, data_chart5_1, data_chart5_2, chart1_color, chart2_color);
    
});


/**
 * Calculates pressure at sea level
 **/
var calculatePressureAtSeaLevel = function(altitude, pressure) {
    var d1 = 1 - (altitude/44330);
    var d2 = Math.pow(d1,5.255);
    return pressure/d2;
};

/**
 * Draw Line Chart
 **/
var drawLineChart = function(chartId, labels,  data, color, bezier) {

    var chartElement = $('#' + chartId);
    var chartParent  = chartElement.parent();

    chartElement.attr('width' , chartParent.width() - 20); // subtract chart margins
    chartElement.attr('height' , chartParent.height() - 40 - 20); // subtract height of header + chart margins

    
    // build chart.js
    var ctx = document.getElementById(chartId).getContext("2d");
    
    
    var data = {
                    labels : labels,
                    datasets : [
                        {
                            fillColor : color.fillColor,
                            strokeColor : color.strokeColor,
                            pointColor : color.pointColor,
                            pointStrokeColor : "#fff",
                            data : data
                        }
                    ]
                }
    
    

    new Chart(ctx).Line(data,  { 
                                    bezierCurve : bezier,
                                    scaleLabel : "<%=value%>hpa"	
                               });
};

/**
 * Draw Radar Chart
 **/
var drawRadarChart = function(chartId, labels,  data_1, data_2, color_1, color_2) {

    var chartElement = $('#' + chartId);
    var chartParent  = chartElement.parent();

    chartElement.attr('width' , chartParent.width() - 20); // subtract chart margins
    chartElement.attr('height' , chartParent.height() - 40 - 20); // subtract height of header + chart margins

    
    // build chart.js
    var ctx = document.getElementById(chartId).getContext("2d");
    
    
    var data = {
                    labels : labels,
                    datasets : [
                        {
                            fillColor : color_1.fillColor,
                            strokeColor : color_1.strokeColor,
                            pointColor : color_1.pointColor,
                            pointStrokeColor : "#fff",
                            data : data_1
                        },
                        {
                            fillColor : color_2.fillColor,
                            strokeColor : color_2.strokeColor,
                            pointColor : color_2.pointColor,
                            pointStrokeColor : "#fff",
                            data : data_2
                        }                        
                    ]
                }    

    

    new Chart(ctx).Radar(data,  {});
};

/**
 * Draw a barchart
 **/
var drawBarChart = function(chartId, labels,  data_1, data_2, color_1, color_2) {

    var chartElement = $('#' + chartId);
    var chartParent  = chartElement.parent();

    chartElement.attr('width' , chartParent.width() - 20); // subtract chart margins
    chartElement.attr('height' , chartParent.height() - 40 - 20); // subtract height of header + chart margins

    
    // build chart.js
    var ctx = document.getElementById(chartId).getContext("2d");
    
    
    var data = {
                    labels : labels,
                    datasets : [
                        {
                            fillColor : color_1.fillColor,
                            strokeColor : color_1.strokeColor,
                            pointColor : color_1.pointColor,
                            pointStrokeColor : "#fff",
                            data : data_1
                        },
                        {
                            fillColor : color_2.fillColor,
                            strokeColor : color_2.strokeColor,
                            pointColor : color_2.pointColor,
                            pointStrokeColor : "#fff",
                            data : data_2
                        }                        
                    ]
                }    

    

    new Chart(ctx).Bar(data,  {});
};

/**
 * Load data
 */
var fetchDataAndUpdateCharts = function() {
    // get data 
    $.get('http://www.simplicity.be:3000/get_data', function(data) {

        var chartData  = data.document_1;
        var chartData2 = data.document_2;

        // process the Data
        processData(chartData, chartData2);
        
    });
};

/**
 * Processes the data
 **/ 
var processData = function(data_1, data_2) {
    
    
    // calculate trend for past hours
    var lastFour = _.last(data_1,4);
    var trend = (lastFour[3].average_pressure - lastFour[0].average_pressure) / 100;
    trend  = trend.toFixed(2);
    var trendString;
        
    
    if (trend > 0 ) {
        
        if( trend <= 1.59 ) {
            trendString = "Rising slowly ( +" + trend + "hpa )";
        } else if (trend >= 1.6 && trend <= 3.5 ) {
            trendString = "Rising  ( +" + trend + "hpa )";
        } else if (trend > 3.5 && trend <= 6.0 ) {
            trendString = "Rising quickly ( +" + trend + "hpa )";
        } else if (trend > 6.0 ) {
            trendString = "Rising  very rapidly ( +" + trend + "hpa )";
        }
        
    } else {
        if( trend >= -1.59 ) {
            trendString = "Falling slowly ( " + trend + "hpa )";
        } else if (trend <= -1.6 && trend >= -3.5 ) {
            trendString = "Falling  ( " + trend + "hpa )";
        } else if (trend < -3.5 && trend >= -6.0 ) {
            trendString = "Falling quickly ( " + trend + "hpa )";
        } else if (trend < - 6.0 ) {
            trendString = "Falling  very rapidly ( " + trend + "hpa )";
        }
        
    }
    
    
    $('#trend').html(trendString);
    
    // show weather (very simplistic !)
    var currentPressure = data_1[23].average_pressure / 100;
    
    if (currentPressure > 1025 ) {
        //console.log('sunny');
        $('#weatherImg').attr('src', 'static/sunny.png' );
    }else if (currentPressure < 1025 && (currentPressure > 1000)) {
        //console.log('partly cloudy');
        $('#weatherImg').attr('src', 'static/cloudy.png' );        
    }   else if (currentPressure < 1000) {
        //console.log('rain');
        $('#weatherImg').attr('src', 'static/rain.png' );        
    }

    // clear previous data (ugly)
    labels_chart1   = [];
    labels_chart2   = [];
    labels_chart3   = [];
    labels_chart5   = [];
    data_chart1     = [];
    data_chart2     = [];
    data_chart3_1   = [];
    data_chart3_2   = [];
    data_chart5_1   = [];
    data_chart5_2   = [];
    
    
    // process data for chart 1
    _.each ( _.last(data_1,3) , function( item ) {
        var hour = item._id.hour + 2 +"h"; // add +2 hours - Europe/Brussels
        var hpa  = calculatePressureAtSeaLevel(currentAltitude, item.average_pressure /100); 
                
        labels_chart1.push(hour);
        data_chart1.push(hpa); 
    });

    // process data for chart 2
    _.each ( data_1 , function( item ) {
        var hour = item._id.hour + 2 +"h"; // add +2 hours - Europe/Brussels
        var hpa  = calculatePressureAtSeaLevel(currentAltitude, item.average_pressure /100); 

        labels_chart2.push(hour);
        data_chart2.push(hpa); 
    });

    // process data for chart 3 & 4
    _.each ( _.last(data_2, 7) , function( item ) {
        var label = item._id.day + " / "  + item._id.month;
        var max_hpa = calculatePressureAtSeaLevel(currentAltitude, item.max_pressure /100); 
        var min_hpa = calculatePressureAtSeaLevel(currentAltitude, item.min_pressure /100); 

        labels_chart3.push(label);
        data_chart3_1.push(max_hpa); 
        data_chart3_2.push(min_hpa); 
    });
    
    // process data for chart 5
    var day_counter = 1;
    _.each ( _.last(data_2, 31) , function( item ) {
        var label = item._id.day + " / "  + item._id.month;
        var max_hpa = calculatePressureAtSeaLevel(currentAltitude, item.max_pressure /100); 
        var min_hpa = calculatePressureAtSeaLevel(currentAltitude, item.min_pressure /100); 

        labels_chart5.push(label);
        data_chart5_1.push(max_hpa); 
        data_chart5_2.push(min_hpa); 
        
        day_counter++;
    });    
    
    $('#chart_5').parent().find('h3').html('Last ' + day_counter + ' days');
    
        // trigger resize event
    $(window).trigger('resize');

};

/**
 * Socket.IO
 **/
socket.on('data_added', function(data){
    
    // show realtime info
    $('#realtime_info').fadeOut(500, function() {
        var date = new Date(data.datetime);
        
        $('#realtime_info').html('Last realtime update : ' + date.getHours() + ':' + date.getMinutes() + 
                                 ' - pressure : ' + ( data.pressure / 100) + 'hpa');
        $('#realtime_info').hide().fadeIn('500');
    });
    
    fetchDataAndUpdateCharts();
});

/**
 * On document load
 **/
$( document ).ready(function() {
    
    // load Data
    fetchDataAndUpdateCharts();
});

