


/*
const legend = d3.select('svg').append('g');
xlv.legendCallbacks.push(function (colourAssignment) {
    legend.selectAll('*').remove();
    let table = '<table>';
    const coloursKeyDiv = document.getElementById('colours');
    if (colourAssignment) {

        const complexColourScheme = xlv.getComplexColours();
        const ccDomain = complexColourScheme.domain();
        const ccRange = complexColourScheme.range();
        table += '<tr style=\'height:10px;\'></tr>';
        for (var i = 0; i < ccDomain.length; i++) {
            //make transparent version of colour
            //var temp = new RGBColor(ccRange[i % 6]);
            //var trans = "rgba(" +temp.r+","+temp.g+","+temp.b+ ", 0.6)";
            table += '<tr><td style=\'width:75px;margin:10px;background:'
                + ccRange[i % 6] + ';border:1px solid '
                + ccRange[i % 6] + ';\'></td><td>'
                + ccDomain[i] + '</td></tr>';
            console.log(i + ' ' + ccDomain[i] + ' ' + ccRange[i]);
        }
        table += '</table>';
        table += '<table>';

        const domain = colourAssignment.domain();
        //~ //console.log("Domain:"+domain);
        const range = colourAssignment.range();
        //~ //console.log("Range:"+range);
        table += '<tr style=\'height:10px;\'></tr>';
        for (var i = 0; i < domain.length; i++) {
            //make transparent version of colour
            var temp = new RGBColor(range[i % 20]);
            const trans = 'rgba(' + temp.r + ',' + temp.g + ',' + temp.b + ', 0.6)';
            table += '<tr><td style=\'width:75px;margin:10px;background:'
                + trans + ';border:1px solid '
                + range[i % 20] + ';\'></td><td>'
                + domain[i] + '</td></tr>';
            //~ //console.log(i + " "+ domain[i] + " " + range[i]);
        }

        table += '</table>';
        coloursKeyDiv.innerHTML = table;


        //~ //d3 svg legend
        //~ verticalLegend = d3.svg.legend().labelFormat("none").cellPadding(5).orientation("vertical").units(xlv.annotationChoice).cellWidth(25).cellHeight(18).inputScale(colourAssignment);
        //~ legend.attr("transform", "translate(20,40)").attr("class", "legend").call(verticalLegend);
    }

}); */