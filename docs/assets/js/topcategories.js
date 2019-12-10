$(document).ready(() => {
    getTopCategories($("#locations").val(), $("#days").val())
});

$("#top-cat-btn").click(() => {
    const location = $("#locations").val()
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
    $("#top-categories-chart-div").append("<canvas id='top-categories-chart' width='920' height='520'><canvas>")
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
                        // max: 2000,
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
