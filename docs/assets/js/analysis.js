const defaultColors = {
    "amsterdam": [220, 20, 60, 1], // crimson
    "barcelona": [255, 127, 80, 1], // coral
    "berlin": [255, 160, 122, 1], // light salmon
    "boston": [255, 165, 0, 1], // orange
    "chicago": [255, 215, 0, 1], // gold
    "lasvegas": [189, 183, 107, 1], // dark khaki
    "london": [143, 188, 143, 1], // dark sea green
    "losangeles": [154, 205, 50, 1], // yellow green
    "madrid": [46, 139, 87, 1], // sea green
    "miami": [64, 224, 208, 1], // turquoise
    "milan": [100, 149, 237, 1], // corn flower blue
    "newyork": [25, 25, 112, 1], // midnight blue
    "paris": [65, 105, 225, 1], // royal blue
    "rio": [139, 0, 139, 1], // dark magenta
    "rome": [221, 160, 221, 1], // plum
    "sandiego": [255, 105, 180, 1], // hot pink
    "sanfrancisco": [210, 105, 30, 1], // chocolate
    "sydney": [112, 128, 144, 1], // slate grey
    "toronto": [188, 143, 143, 1], // rosy brown
    "sydney": [138, 43, 226, 1], // blue violet
    "vancouver": [255, 0, 255, 1], // magenta fuchsia
}
let topCatChart

$(document).ready(() => {
    createMultiselects()
    createTopCategoriesChart()
    $("#top-cat-btn").trigger("click")
    $("#prog-locations").trigger("change")
    $("#prog-period").trigger("change")
    $("#top-cat-period").trigger("change")
});

function createMultiselects() {
    $('select[id=top-cat-locations], select[id=prog-locations]').multiselect({
        nonSelectedText: 'Select Locations',
        buttonWidth: '200px',
        maxHeight: 250
    })
    $('#top-cat-single-location').multiselect({
        buttonWidth: '200px',
        maxHeight: 250,
        multiple: false
    })
    $('#prog-categories').multiselect({
        nonSelectedText: 'Select Categories',
        buttonWidth: '225px',
        maxHeight: 250
    });
    $('select[id=top-cat-period], select[id=prog-period]').multiselect({
        multiple: false
    })
    $('select[id=top-cat-days], select[id=prog-days]').multiselect({
        multiple: false,
        buttonWidth: '170px',
    })
}

$("#top-cat-btn").click(() => {
    const locations = $("#top-cat-locations").val()
    const singleLocation = $("#top-cat-single-location").val()
    const locationName = $("#top-cat-single-location option:selected").text()
    if (!(locations.includes(singleLocation)))
        locations.push(singleLocation)
    const numCategories = $("#num-categories").val()
    const format = $("#top-cat-period").val()
    const period = format === "day" ? $("#prog-days").val() : "week"
    const lastLocationIndex = locations.length - 1

    const locationsDict = {}
    const categoriesDict = {}
    let i = 0
    locations.forEach(location => {
        const path = "data/" + location + "/analysis.json"
        const locationCategories = []
        getLocationCategoriesInfo(location, path, format, period, counts => {
            const [r, g, b, a] = defaultColors[location]
            const length = counts.length
            counts.forEach(count => {
                const index = counts.indexOf(count)
                const red = ((255 - r) * (index / length)) + r
                const green = ((255 - g) * (index / length)) + g
                const blue = ((255 - b) * (index / length)) + b
                const color = "rgba(" + red + "," + green + "," + blue + "," + a + ")"
                const category = count["category"]
                const checkins = count["checkins"]
                locationCategories.push({ "category": category, "checkins": checkins, "color": color })
            })
            if ($("#top-cat-locations").val().includes(location)) {
                locationsDict[location] = locationCategories
                locationsDict[location].forEach(item => {
                    if ([item["category"]] in categoriesDict)
                        categoriesDict[[item["category"]]] += item["checkins"]
                    else
                        categoriesDict[[item["category"]]] = item["checkins"]
                })
            }
            if (location === singleLocation) {
                const text = locationName + " " + period + " top " + numCategories + " categories"
                createLocTopCategoriesChart(locationCategories.slice(0, numCategories), text)
            }
            if (i++ === lastLocationIndex) {
                sortDict(categoriesDict, sortedCategories => updateTopCategoriesChart(
                    sortedCategories.slice(0, numCategories), locationsDict, period))
            }
        })
    })
})

function getLocationCategoriesInfo(location, path, format, period, f) {
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
        sortDict(counts, f)
    })
}

function updateTopCategoriesChart(categories, locationsDict, period) {
    const names = categories.map(item => item["category"])
    const locationsTopCategories = {}
    topCatChart.data.datasets = []
    topCatChart.data.labels = names
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

function sortDict(dict, f) {
    const items = Object.keys(dict).map((key) => [key, dict[key]])
    const sortedItems = items.sort((first, second) => second[1] - first[1])
    const sortedDicts = []
    sortedItems.forEach(item => {
        sortedDicts.push({ "category": item[0], "checkins": item[1] })
    })
    f(sortedDicts)
}

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
})

$("#top-cat-days").change(() => {
    resetTopCategoriesData()
})

function resetTopCategoriesData() {
    topCatChart.data.datasets = []
    topCatChart.data.labels = []
    topCatChart.update();
}

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

$("#prog-btn").click(() => {
    const locations = $("#prog-locations").val()
    const categories = $("#prog-categories").val()
    const format = $("#prog-period").val()
    const period = format === "day" ? $("#prog-days").val() : "week"
    const pathPrefix = format === "day" ? "local-time-data/" : "data/"

    const categoriesInfo = {}
    locations.forEach(location => {
        categoriesInfo[location] = []
        const path = pathPrefix + location + "/analysis.json"
        categories.forEach(category => {
            getLocationProgInfo(location, category, path, format, period, checkins => {
                const total = checkins.reduce((a, b) => a + b, 0)
                categoriesInfo[location].push({ "category": category, checkins: checkins, "total": total })
                if (categories.length === categoriesInfo[location].length) {
                    const [r, g, b, a] = defaultColors[location]
                    const length = categories.length
                    categoriesInfo[location].sort((a, b) => b["total"] - a["total"])
                    categoriesInfo[location].forEach(item => {
                        const index = categoriesInfo[location].indexOf(item)
                        const red = ((255 - r) * (index / length)) + r
                        const green = ((255 - g) * (index / length)) + g
                        const blue = ((255 - b) * (index / length)) + b
                        const color = "rgba(" + red + "," + green + "," + blue + "," + a + ")"
                        const checkins = item["checkins"]
                        const label = location + " " + item["category"]
                        addProgData(label, color, checkins)
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

function getLocationProgInfo(location, category, path, format, period, f) {
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
    const label = $("#prog-list label[for=prog-days]")
    const select = $("#prog-days")
    if (format === "day") {
        text = "Checkins by hour"
        labels = Array(24).fill().map((_, i) => i)
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
