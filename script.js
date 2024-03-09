$(function() {

    const correlationRequest = new Request('correlation_categories_2024.json');

    fetch(correlationRequest)
        .then((response) => response.json())
        .then((data) => {
            
            CorrelationData = data;
            console.log(data);

            data.i.forEach((e) => {
                //console.log(Object.values(e)[0]);
                let category = Object.keys(e)[0];
                let categoryInstruments = Object.values(e)[0];
                let className = category.toLowerCase().replace(" ","");
                $('#accordion').append(`<h3>${category}</h3><div><p class="${className}"></p></div>`);
                categoryInstruments.forEach((i) => {
                    let cleanedClass = i.n;//.replace('.',"");
                    $(`#accordion .${className}`).append(`<li class="instrument"><label><input type="checkbox" class="${cleanedClass}">${i.fn}</label></li>`);
                })

            });
/*
            for(const [key, value] of Object.entries(data.i)) {
                console.log(`${key}: ${value}`);
                //$('ul.available-instruments').append(`<li class="instrument"><input type="checkbox" class="${key}">${key}</li>`);
            }
//*/
            
        });

    
})

window.onload = function() {

    $( "#accordion" ).accordion({
        collapsible: true
    });

    $("#tabs").tabs({
        active: 0
    });

    let CorrelationData;
    let TFs = ["H1", "D1", "W1", "MN1"];
    let maxCheckedInstruments = 20;

    function CalculateCorrelation(symbol1Prices, symbol2Prices, periods) {
                                                       
        if(periods < 2) { return(-2); }                                     // Ako je n manji od 2 (premalo sveca) ne racunaj nista, vrati -2 (legacy kod, neko je to stavio)
        
        let	sum_sq_x = 0,
            sum_sq_y = 0,
            sum_coproduct = 0,
            mean_x = symbol1Prices[0],
            mean_y = symbol2Prices[0];

        for(let i = 0; i < periods; i++) {                                 // Vrtimo svece od trenutne do n, tj perioda koji posmatramo
            let	sweep = i / (i + 1.0),
                delta_x = symbol1Prices[i] - mean_x,
                delta_y = symbol2Prices[i] - mean_y;

            sum_sq_x += delta_x * delta_x * sweep;
            sum_sq_y += delta_y * delta_y * sweep;
            sum_coproduct += delta_x * delta_y * sweep;
            mean_x += delta_x / (i + 1.0);
            mean_y += delta_y / (i + 1.0);
        }

        let	pop_sd_x = Math.sqrt(sum_sq_x / periods),
            pop_sd_y = Math.sqrt(sum_sq_y / periods),
            cov_x_y = sum_coproduct / periods;

        if(pop_sd_x * pop_sd_y != 0.0) {
            let correlationValue = cov_x_y / (pop_sd_x * pop_sd_y);
            return Math.round((correlationValue + Number.EPSILON) * 100) / 100;                      // Vracamo vrednost korelacije, ako je rezultat razlicit od nule
        }
        
        return(-3);                                                      // legacy kod, neko je stavio da bude -3 ako je doslo do greske
    }

    const correlationRequest = new Request('correlationTest.json');

    fetch(correlationRequest)
        .then((response) => response.json())
        .then((data) => {
            CorrelationData = data;
        });
    /*
    $('body').on('mouseenter','table td.cell', function(){
        var _this = $(this);
        var idx = _this.index() - 1;
        $('tr').each(function(){
            $(this).find('td.cell:eq(' + idx + ')').addClass('hovered');
        });
    });
    $('body').on('mouseleave','table td.cell', function(){
        $('td.hovered').removeClass('hovered');
    });
    //*/
    let allInputs = "li.instrument input";

// <--------------------------------------------------------------------------

    $('.btn-calculate-correlation').click(() => {
        
        $('.correlationTable').each((index, table) => {
            $(table).find('thead tr th:gt(0)').remove();
            $(table).find('tbody tr').remove();
        });

        //*

        // vidi koji su checkirani instrumenti, sacuvaj i protrci kroz njih racunajuci korelaciju
        let checkedInstruments = [];
        $(`${allInputs}:checked`).each((index, instrument) =>{
        //    console.log(instrument);
            checkedInstruments.push({class: $(instrument).attr('class'), name: $(instrument).parent().text()});
        });
        console.log(checkedInstruments);

        // Pravljenje tabele
        for(let i = 0; i < checkedInstruments.length; i++) {
            $(".correlationTable").each((index, table) => {
                $(table).find('thead tr').append(`<th class="${checkedInstruments[i].class}">${checkedInstruments[i].name}</th>`);
                $(table).find('tbody').append(`<tr><th class="${checkedInstruments[i].class}">${checkedInstruments[i].name}</th></tr>`);
            });

        }

        $(".correlationTable").each((index, table) => {         
            $(table).find('tbody tr').each((rowIndex, row) => {
                for(let i = 0; i < checkedInstruments.length; i++) {
                    let rowInstr = $(row).find('th').prop("class");
                    let columnInstr = checkedInstruments[i].class; 
                    let className = rowIndex < i ? rowInstr + "_" + columnInstr : columnInstr + "_" + rowInstr; 
                    
                    $(row).append(`<td class="cell ${className}"></td>`);
                }
            });
        });


        for(let i = 0; i < checkedInstruments.length; i++) {

            for(let j = i + 1; j < checkedInstruments.length; j++) {
                
                let instrument1 = checkedInstruments[i].class;
                let instrument2 = checkedInstruments[j].class;
                
                for(let t = 0; t < TFs.length; t++) {
                    let firstSymbol = CorrelationData.c[instrument1].tf[TFs[t]];
                    let secondSymbol = CorrelationData.c[instrument2].tf[TFs[t]];
                    let numberOfCandles = firstSymbol.length < secondSymbol.length ? firstSymbol.length : secondSymbol.length;
                    
                    let corrValue = CalculateCorrelation(firstSymbol, secondSymbol, numberOfCandles);
                    console.log(`${instrument1} - ${instrument2} - TimeFrame: ${TFs[t]} correlation: ${corrValue}`);

                    let visual = $('#state input:checked').val();
                    let className = "";
                    let allClasses = `high_positive highest_positive neutral high_negative highest_negative
                    high_positive_bgr highest_positive_bgr high_negative_bgr highest_positive_bgr
                    high_positive_font highest_positive_font high_negative_font highest_positive_font
                    `;

                    if(visual == "all") {
                        if(corrValue >= 0.75) {
                            className = "highest_positive";
                        } else if(corrValue >= 0.2) {
                            className = "high_positive";
                        } else if(corrValue <= -0.75) {
                            className = "high_negative";
                        } else if(corrValue <= -0.2) {
                            className = "highest_negative";
                        } else {
                            className = "neutral";
                        }
                    } else if(visual == "values") {
                        if(corrValue >= 0.75) {
                            className = "highest_positive_font";
                        } else if(corrValue >= 0.2) {
                            className = "high_positive_font";
                        } else if(corrValue <= -0.75) {
                            className = "high_negative_font";
                        } else if(corrValue <= -0.2) {
                            className = "highest_negative_font";
                        } else {
                            className = "neutral_font";
                        }
                    } else if(visual == "heatmap") {
                        if(corrValue >= 0.75) {
                            className = "highest_positive_bgr";
                        } else if(corrValue >= 0.2) {
                            className = "high_positive_bgr";
                        } else if(corrValue <= -0.75) {
                            className = "high_negative_bgr";
                        } else if(corrValue <= -0.2) {
                            className = "highest_negative_bgr";
                        } else {
                            className = "neutral_bgr";
                        }
                    }

                    $(`.${TFs[t]}`).find(`.${instrument1}_${instrument2}`).text(corrValue).removeClass(allClasses).addClass(className);
                    $(`.${TFs[t]}`).find(`.${instrument1}_${instrument1}`).text("-");
                    $(`.${TFs[t]}`).find(`.${instrument2}_${instrument2}`).text("-");
                }

            }
        }
        //*/
    });

    $('#state input').on('click', function(e) {

        let visual = $(e.target).val();

        console.log(visual);

        //let visual = $('#state input:checked').val();
        let className = "";
        let allClasses = `
        high_positive       highest_positive        high_negative       highest_negative
        high_positive_bgr   highest_positive_bgr    high_negative_bgr   highest_negative_bgr
        high_positive_font  highest_positive_font   high_negative_font  highest_negative_font
        neutral neutral_font neutral_bgr
        `;

        if(visual == "all") {
            $('td.cell').each((index, td) => {
                let cls = $(td).attr('class');
                if(cls.indexOf('highest_positive') > -1) { $(td).removeClass(allClasses).addClass('highest_positive'); } else
                if(cls.indexOf('high_positive') > -1) { $(td).removeClass(allClasses).addClass('high_positive'); } else
                if(cls.indexOf('high_negative') > -1) { $(td).removeClass(allClasses).addClass('high_negative'); } else 
                if(cls.indexOf('highest_negative') > -1) { $(td).removeClass(allClasses).addClass('highest_negative'); } else
                if(cls.indexOf('neutral') > -1) { $(td).removeClass(allClasses).addClass('neutral'); }
            });

        } else if(visual == "values") {
            $('td.cell').each((index, td) => {
                let cls = $(td).attr('class');
                if(cls.indexOf('highest_positive') > -1) { $(td).removeClass(allClasses).addClass('highest_positive_font'); } else
                if(cls.indexOf('high_positive') > -1) { $(td).removeClass(allClasses).addClass('high_positive_font'); } else
                if(cls.indexOf('high_negative') > -1) { $(td).removeClass(allClasses).addClass('high_negative_font'); } else 
                if(cls.indexOf('highest_negative') > -1) { $(td).removeClass(allClasses).addClass('highest_negative_font'); } else
                if(cls.indexOf('neutral') > -1) { $(td).removeClass(allClasses).addClass('neutral_font'); }
            });
        } else if(visual == "heatmap") {
            $('td.cell').each((index, td) => {
                let cls = $(td).attr('class');
                if(cls.indexOf('highest_positive') > -1) { $(td).removeClass(allClasses).addClass('highest_positive_bgr'); } else
                if(cls.indexOf('high_positive') > -1) { $(td).removeClass(allClasses).addClass('high_positive_bgr'); } else
                if(cls.indexOf('high_negative') > -1) { $(td).removeClass(allClasses).addClass('high_negative_bgr'); } else 
                if(cls.indexOf('highest_negative') > -1) { $(td).removeClass(allClasses).addClass('highest_negative_bgr'); } else
                if(cls.indexOf('neutral') > -1) { $(td).removeClass(allClasses).addClass('neutral_bgr'); }
            });
        }
    });

    // Unchekiraj sve checkboxove
    $('.btn-clear-selection').click(() => {
        $(allInputs).prop('checked', false);
        $(allInputs).prop('disabled', false);
        $('.picked-instruments-counter').text(maxCheckedInstruments);
        $('.btn-calculate-correlation').prop('disabled', true);
    });

    // Azuriraj span sa brojem checkiranih, enable dugme za kalkulaciju ako je chekirano vise od jednog instrumenta, disable dugme za kalkulaciju ako je checkirano vise od 20
    $('body').on('click', allInputs, (e) => {

        let numberOfChecked = $(`${allInputs}:checked`).length; // koliko ima checkiranih

        if(numberOfChecked > 1) {
            $('.btn-calculate-correlation').prop('disabled', false);                // Ako je vise od jednog instumenta enable dugme za racunanje
        } else {
            $('.btn-calculate-correlation').prop('disabled', true);                 // u suprotnom ga disable
        }

        let remainingInstruments = maxCheckedInstruments - numberOfChecked;
        
        if(remainingInstruments <= 0) {                                                 // Ako je dostignut limit za broj cekiranih
            $(`${allInputs}:not(:checked)`).prop('disabled', true);  // Disable preostale checkboxove
        } else {
            $(`${allInputs}:not(:checked)`).prop('disabled', false); // u suprotnom enable them
        }

        $('.picked-instruments-counter').text(remainingInstruments);                    // azuriraj broj preostalih mogucih chekiranih na stranici

    });
}