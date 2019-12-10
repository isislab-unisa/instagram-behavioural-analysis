let progChart

$(document).ready(() => {
    showCategories()
    initProgressChart()
});

$("#prog-btn").click(() => {
    const format = $("#day-or-week-select").val()
    const location = $("#prog-locations").val()
    const category = $("#prog-categories-select").val()
    if (format == "day") {
        const day = $("#days-select").val()
        getDayInfo(location, category, day)
    }
    else if (format == "week")
        getWeekInfo(location, category)
})

$("#clear-btn").click(() => {
    progChart.data.datasets = []
    progChart.update();    
})

function addData(label, data) {
    const red = Math.floor(Math.random() * 256)
    const green = Math.floor(Math.random() * 256)
    const blue = Math.floor(Math.random() * 256)
    const newDataset = {
        label: label,
        borderColor: 'rgba(' + red + ',' + green + ',' + blue + ', 1)',
        fill: false,
        data: data
    }
    progChart.data.datasets.push(newDataset)
    progChart.update();
}

function initProgressChart() {
    let labels, text
    const format = $("#day-or-week-select").val()
    if (format == "day") {
        text = "Checkins by hour"
        labels = Array(24).fill().map((_, i) => i)
        showDays()
    }
    else if (format == "week") {
        text = "Checkins by days"
        labels = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        $('#days-select').remove()
    }
    createProgressChart(labels, text)
}

function getDayInfo(location, category, day) {
    $.getJSON("local-time-data/" + location + "/analysis.json", (json) => {
        let hours_dict = {}
        $.each(json[day], (hour) => {
            const occurrences = json[day][hour][category]
            hours_dict[hour] = occurrences != undefined ? occurrences : 0
        })
        const hours = Object.keys(hours_dict)
        const occurrences = Object.values(hours_dict)
        const timezone = "(" + json["timezone"] + ")"
        const label = location + timezone + " - " + category + " - " + day
        addData(label, occurrences)
    })
}

function getWeekInfo(location, category) {
    $.getJSON("data/" + location + "/analysis.json", (json) => {
        let days_dict = {}
        $.each(json, (day) => {
            days_dict[day] = 0
            $.each(json[day], (hour) => {
                const occurrences = json[day][hour][category]
                if (occurrences != undefined) {
                    days_dict[day] += occurrences
                }
            })
        })
        const days = Object.keys(days_dict)
        const occurrences = Object.values(days_dict)
        const label = location + " - " + category
        addData(label, occurrences)
    })
}

function createProgressChart(labels, text) {
    progChart = new Chart(document.querySelector("#progChart"), {
        type: 'line',
        data: {
            labels: labels,
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: text,
                fontSize: 18,
                fontFamily: "Bold"
            },
            legend: {
                display: true,
                labels: {
                    fontSize: 16,
                    fontFamily: "Bold"
                }
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        zeroLineColor: "black",
                        zeroLineWidth: 0.5
                    },
                    ticks: {
                        // max: 1000,
                        min: 0,
                        fontSize: 16,
                        fontFamily: "Bold",
                    }
                }],
                yAxes: [{
                    gridLines: {
                        zeroLineColor: "black",
                        zeroLineWidth: 0.5
                    },
                    ticks: {
                        // max: 1000,
                        min: 0,
                        stepSize: 200,
                        fontSize: 14,
                        fontFamily: "Bold",
                        // margin: 20,
                        // padding: 20
                    }
                }]
            }
        }
    });
}

function showCategories() {
    // $("#prog-categories-select").remove()
    const select = $("#prog-categories-select")
    // console.log(select)
    // select.options.length = 0
    const location = $("#prog-locations").val()
    // const select = $("<select id='categories-select' name='categories-select'>")
    let categories = []
    $.getJSON("data/" + location + "/analysis.json", (json) => {
        $.each(json, (day) => {
            $.each(json[day], (hour) => {
                $.each(json[day][hour], (category) => {
                    if (!categories.includes(category)) {
                        categories.push(category)
                    }
                })
            })
        })
        categories.sort((a, b) => a > b)
        categories.forEach(category => select.append(new Option(category, category)))
    })
    // $("#form-div").append(select)
}

function showDays() {
    const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    let select = $("<select id='days-select' name='days-select'>")
    days.forEach(day => {
        select.append(new Option(day, day))
    });
    $("#form-div").append(select)
}