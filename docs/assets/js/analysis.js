const defaultColors = {}
let topCatChart

$(document).ready(() => {
    mapCityColors()
    createMultiselects()
    createTopCategoriesChart()
    $("#top-cat-single-location").trigger("change")
    $("#prog-locations").trigger("change")
    $("#prog-period").trigger("change")
    $("#top-cat-period").trigger("change")
});

// Map each city to a default color
function mapCityColors() {
    $.getJSON("cities.json", json => {
        json.forEach(item => {
            defaultColors[item["city"]] = item["rgba"]
        })
    })
}

// Create selects
function createMultiselects() {
    $('select[id=top-cat-locations], select[id=prog-locations]').multiselect({
        nonSelectedText: 'Select Locations',
        buttonWidth: '185px',
        maxHeight: 250,
        includeSelectAllOption: true
    })
    $('#top-cat-single-location').multiselect({
        buttonWidth: '185px',
        maxHeight: 250,
        multiple: false
    })
    $('#prog-categories').multiselect({
        nonSelectedText: 'Select Categories',
        buttonWidth: '210px',
        maxHeight: 250
    });
    $('select[id=top-cat-period], select[id=prog-period]').multiselect({
        multiple: false
    })
    $('select[id=top-cat-days], select[id=prog-days], select[id=prog-values]').multiselect({
        multiple: false,
        buttonWidth: '170px',
    })
}

// Get info about locations top categories
$("#top-cat-locations").change(() => {
    const locations = $("#top-cat-locations").val()
    const numCategories = $("#num-categories").val()
    const format = $("#top-cat-period").val()
    const period = format === "day" ? $("#top-cat-days").val() : "week"
    const lastLocationIndex = locations.length - 1

    // Get for each selected location the checkins for every category
    const locationsDict = {}
    const categoriesDict = {}
    let i = 0
    locations.forEach(location => {
        const locationCategories = []
        getLocationCategoriesInfo(location, format, period, infos => {
            infos.forEach(info => {
                const category = info["category"]
                const checkins = info["checkins"]
                const color = info["color"]
                locationCategories.push({ "category": category, "checkins": checkins, "color": color })
            })
            // Count the overall checkins for each category in the selected locations
            locationsDict[location] = locationCategories
            locationsDict[location].forEach(item => {
                if ([item["category"]] in categoriesDict)
                    categoriesDict[[item["category"]]] += item["checkins"]
                else
                    categoriesDict[[item["category"]]] = item["checkins"]
            })
            // Update the top categories chart when every location info has been retrieved
            if (i++ === lastLocationIndex) {
                sortDict(categoriesDict, sortedCategories => updateTopCategoriesChart(
                    sortedCategories.slice(0, numCategories), locationsDict, period))
            }
        })
    })
})

// Retrieve for each category the number of checkins in a location
function getLocationCategoriesInfo(location, format, period, f) {
    const path = "data/" + location + "/analysis.json"
    $.getJSON(path, (json) => {
        const counts = {}
        $.each(json, (day) => {
            if (format === "day" && day != period)
                return true
            $.each(json[day], (hour, categories) => {
                $.each(categories, (category, checkins) => {
                    if (category in counts)
                        counts[category] += checkins
                    else
                        counts[category] = checkins
                })
            })
        })
        // Sort the counts and map a color to each category
        sortDict(counts, sorted => setColors(location, sorted, f))
    })
}

// Assign a chromatic scale to items according to the positions of its elements
function setColors(location, items, f) {
    const [r, g, b, a] = defaultColors[location]
    const length = items.length
    items.forEach(item => {
        const index = items.indexOf(item)
        const red = ((255 - r) * (index / length)) + r
        const green = ((255 - g) * (index / length)) + g
        const blue = ((255 - b) * (index / length)) + b
        const color = "rgba(" + red + "," + green + "," + blue + "," + a + ")"
        item["color"] = color
    })
    f(items)
}

// Show info about top categories in the selected locations
function updateTopCategoriesChart(categories, locationsDict, period) {
    const names = categories.map(item => item["category"])
    const locationsTopCategories = {}
    topCatChart.data.datasets = []
    topCatChart.data.labels = names
    // Get the top categories checkins in each location
    $.each(locationsDict, location => {
        locationsTopCategories[location] = []
        names.forEach(name => {
            locationsDict[location].forEach(item => {
                if (item["category"] === name) {
                    const info = { "category": item["category"], "checkins": item["checkins"], "color": item["color"] }
                    locationsTopCategories[location].push(info)
                }
            })
        })
    })
    // Create datasets and update the chart
    $.each(locationsTopCategories, location => {
        const newDataset = {
            label: location,
            backgroundColor: locationsTopCategories[location].map(location => location["color"]),
            hoverBackgroundColor: locationsTopCategories[location].map(location => location["color"]),
            data: locationsTopCategories[location].map(location => location["checkins"])
        }
        topCatChart.data.datasets.push(newDataset)
    })
    topCatChart.update()
}

// Sort a dictionary according to values
function sortDict(dict, f) {
    const items = Object.keys(dict).map((key) => [key, dict[key]])
    const sortedItems = items.sort((first, second) => second[1] - first[1])
    const sortedDicts = []
    sortedItems.forEach(item => {
        sortedDicts.push({ "category": item[0], "checkins": item[1] })
    })
    f(sortedDicts)
}

// Get info about single location top categories
$("#top-cat-single-location").change(() => {
    const location = $("#top-cat-single-location").val()
    const locationName = $("#top-cat-single-location option:selected").text()
    const numCategories = $("#num-categories").val()
    const format = $("#top-cat-period").val()
    const period = format === "day" ? $("#top-cat-days").val() : "week"

    // Get for each selected location the checkins for every category
    const locationCategories = []
    getLocationCategoriesInfo(location, format, period, infos => {
        infos.forEach(info => {
            const category = info["category"]
            const checkins = info["checkins"]
            const color = info["color"]
            locationCategories.push({ "category": category, "checkins": checkins, "color": color })
        })
        // Create the single location top categories chart
        const text = locationName + " " + period + " top " + numCategories + " categories"
        createLocTopCategoriesChart(locationCategories.slice(0, numCategories), text)
    })
})

$("#top-cat-period").change(() => {
    const format = $("#top-cat-period").val()
    const label = $("#top-cat-list label[for=top-cat-days]")
    const select = $("#top-cat-days")
    if (format === "week") {
        label.addClass("d-none")
        select.next().hide()
    }
    else if (format === "day") {
        label.removeClass("d-none")
        select.next().show()
    }
    resetTopCategoriesData()
    $("#top-cat-locations").trigger("change")
    $("#top-cat-single-location").trigger("change")
})

$("#num-categories").change(() => {
    $("#top-cat-locations").trigger("change")
    $("#top-cat-single-location").trigger("change")
})

$("#top-cat-days").change(() => {
    resetTopCategoriesData()
    $("#top-cat-locations").trigger("change")
    $("#top-cat-single-location").trigger("change")
})

function resetTopCategoriesData() {
    topCatChart.data.datasets = []
    topCatChart.data.labels = []
    topCatChart.update();
}

// Create chart showing top categories of selected locations
function createTopCategoriesChart() {
    const canvas = document.querySelector("#topCatChart").getContext("2d");
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            display: true,
            text: "Most popular categories",
            fontSize: 18,
            fontFamily: "Bold"
        },
        legend: {
            display: false,
        },
        scales: {
            yAxes: [{
                gridLines: {
                    zeroLineColor: "black",
                    zeroLineWidth: 0.5
                },
                ticks: {
                    min: 0,
                    stepSize: 500,
                    fontSize: 20,
                    fontFamily: "Bold",
                },
                scaleLabel: {
                    display: true,
                    labelString: "checkins",
                    fontSize: 30,
                    fontFamily: "Bold"
                },
            }],
            xAxes: [{
                gridLines: {
                    zeroLineColor: "black",
                    zeroLineWidth: 0.5
                },
                ticks: {
                    fontSize: 14,
                    fontFamily: "Bold",
                },
                scaleLabel: {
                    display: true,
                    labelString: "categories",
                    fontSize: 30,
                    fontFamily: "Bold"
                },
            }]
        },
    }

    topCatChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: []
            }],
        },
        options: chartOptions
    });
}

// Create chart showing top categories in a single location
function createLocTopCategoriesChart(data, text) {
    const categories = data.map(item => item["category"])
    const checkins = data.map(item => item["checkins"])
    const colors = data.map(item => item["color"])
    $("#top-categories-chart").remove()
    $("#top-categories-chart-div").append("<canvas id='top-categories-chart'>")
    const ctx = document.querySelector("#top-categories-chart").getContext("2d");
    const chartData = {
        barPercentage: 1,
        backgroundColor: colors,
        hoverBackgroundColor: colors,
        borderColor: colors,
        data: checkins
    }
    const chartOptions = {
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
        }
    }
    const chart = new Chart(ctx, {
        type: "horizontalBar",
        data: {
            labels: categories,
            datasets: [chartData]
        },
        options: chartOptions,
        elements: {
            rectangle: {
                borderSkipped: 'left',
            }
        }
    });
}

let progChart

// Get for each selected category the number of checkins in the selected locations
$("#prog-btn").click(() => {
    const locations = $("#prog-locations").val()
    const categories = $("#prog-categories").val()
    const format = $("#prog-period").val()
    const period = format === "day" ? $("#prog-days").val() : "week"
    const normalized = $("#prog-values").val() === "normalized"

    // Count for each selected location the checkins for every selected category
    const categoriesInfo = {}
    locations.forEach(location => {
        categoriesInfo[location] = []
        categories.forEach(category => {
            getLocationProgInfo(location, category, format, period, checkins => {
                const total = checkins.reduce((a, b) => a + b, 0)
                categoriesInfo[location].push({ "category": category, checkins: checkins, "total": total })
                // When every category info has been retrieved add the datasets
                if (categories.length === categoriesInfo[location].length) {
                    categoriesInfo[location].sort((a, b) => b["total"] - a["total"])
                    setColors(location, categoriesInfo[location], items => {
                        items.forEach(item => {
                            const checkins = item["checkins"]
                            const color = item["color"]
                            const label = location + " " + item["category"]
                            if (normalized)
                                $.getJSON("cities.json", json => {
                                    const total = json.filter(item => item["city"] === location).map(item => item["stories"])
                                    const normalized = checkins.map(n => (n / total).toFixed(5))
                                    addProgData(label, color, normalized)
                                })
                            else
                                addProgData(label, color, checkins)
                        })
                    })
                }
            })
        })
    })
})

$("#clear-btn").click(() => {
    progChart.data.datasets = []
    progChart.update();
})

// Find the number of a category checkins in a location
function getLocationProgInfo(location, category, format, period, f) {
    const pathPrefix = format === "day" ? "local-time-data/" : "data/"
    const path = pathPrefix + location + "/analysis.json"
    $.getJSON(path, (json) => {
        const counts = {}
        $.each(json, (day) => {
            $.each(json[day], (hour) => {
                const occurrences = json[day][hour][category] === undefined ? 0 : json[day][hour][category]
                if (format === "day" && day == period)
                    counts[hour] = occurrences
                else if (format === "week") {
                    if (day in counts)
                        counts[day] += occurrences
                    else {
                        counts[day] = occurrences
                    }
                }
                else
                    return true
            })
        })
        const checkins = Object.values(counts)
        f(checkins)
    })
}

// Add dataset to progress chart
function addProgData(label, color, data) {
    const newDataset = {
        label: label,
        borderColor: color,
        fill: false,
        data: data
    }
    progChart.data.datasets.push(newDataset)
    progChart.update();
}

// Create progress chart
function createProgressChart(labels, text) {
    $("#progChart").remove()
    $("#prog-chart-div").append("<canvas id='progChart'>")
    const chartOptions = {
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
                }
            }]
        }
    }
    progChart = new Chart(document.querySelector("#progChart"), {
        type: 'line',
        data: {
            labels: labels,
        },
        options: chartOptions,

    });
}

$("#prog-period").change(() => {
    let labels, text
    const format = $("#prog-period").val()
    const label = $("#prog-period-list label[for=prog-days]")
    const select = $("#prog-days")
    if (format === "day") {
        text = "Checkins by hour"
        labels = Array(24).fill().map((_, i) => i < 9 ? "0" + i + ":00" : i + ":00")
        label.removeClass("d-none")
        select.next().show()
    }
    else if (format === "week") {
        text = "Checkins by days"
        labels = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        label.addClass("d-none")
        select.next().hide()
    }
    createProgressChart(labels, text)
})

// Show categories present in the selected locations
$("#prog-locations").change(() => {
    const categories = []
    const select = $("#prog-categories")
    select.empty()
    const locations = $("#prog-locations").val()
    const lastLocationIndex = locations.length - 1
    let i = 0
    locations.forEach(location => {
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
            if (i++ === lastLocationIndex) {
                categories.sort((a, b) => a > b)
                categories.forEach(category => select.append(new Option(category, category)))
                $("#prog-categories").multiselect("rebuild")
            }
        })
    })
})
