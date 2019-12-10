$(document).ready(() => {
    getTopCategories($("#top-cat-locations").val(), $("#days").val())
    showCategories()
    initProgressChart()
});

$("#top-cat-btn").click(() => {
    const location = $("#top-cat-locations").val()
    const day = $("#days").val()
    getTopCategories(location, day)
})

function sortDict(dict) {
    let items = Object.keys(dict).map((key) => [key, dict[key]])
    items.sort((first, second) => second[1] - first[1])
    return items.slice(0, 20)
}

function getTopCategories(location, day) {
    $.getJSON("data/" + location + "/analysis.json", (json) => {
        let counts = {}
        $.each(json[day], (hour, categories) => {
            $.each(categories, (category, checkins) => {
                counts[category] = counts[category] == undefined ? checkins : counts[category] + checkins
            })
        })
        const sorted = sortDict(counts)
        const categories = sorted.map(item => item[0])
        const checkins = sorted.map(item => item[1])
        const text = location + " top 20 categories on " + day.charAt(0).toLowerCase() + day.slice(1)
        createTopCategoriesChart(categories, checkins, text)
    })
}

function createTopCategoriesChart(categories, checkins, text) {
    $("#top-categories-chart").remove()
    $("#top-categories-chart-div").append("<canvas id='top-categories-chart'><canvas>")
    const ctx = document.querySelector("#top-categories-chart").getContext("2d");
    const chart = new Chart(ctx, {
        type: "horizontalBar",
        data: {
            labels: categories,
            datasets: [{
                barPercentage: 1,
                backgroundColor: Array(20).fill().map((_, i) => "rgba(" + i * 12 + ", 99, 132, 0.6)"),
                borderColor: Array(20).fill().map((_, i) => "rgba(" + i * 12 + ", 99, 132, 1)"),
                data: checkins
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: text,
                fontSize: 18,
                fontFamily: "Bold"
            },
            legend: {
                display: false,
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 20,
                        fontFamily: "Bold",
                    }
                }],
                xAxes: [{
                    gridLines: {
                        zeroLineColor: "black",
                        zeroLineWidth: 0.5
                    },
                    ticks: {
                        min: 0,
                        stepsize: 100,
                        fontSize: 16,
                        fontFamily: "Bold",
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "checkins",
                        fontSize: 30,
                        fontFamily: "Bold"
                    },
                }]
            },
            elements: {
                rectangle: {
                    borderSkipped: 'left',
                }
            }
        }
    });
}

let progChart
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
        $('#prog-list li:last').removeClass("d-none")
    }
    else if (format == "week") {
        text = "Checkins by days"
        labels = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        $('#prog-list li:last').addClass("d-none")
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
    $("#progChart").remove()
    $("#prog-chart-div").append("<canvas id='progChart'>")
    progChart = new Chart(document.querySelector("#progChart"), {
        type: 'line',
        data: {
            labels: labels,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                        min: 0,
                        stepSize: 200,
                        fontSize: 14,
                        fontFamily: "Bold",
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "checkins",
                        fontSize: 30,
                        fontFamily: "Bold"
                    },

                }]
            }
        }
    });
}

function showCategories() {
    const select = $("#prog-categories-select")
    const location = $("#prog-locations").val()
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
}
