define([
    'marionette'
], function(Marionette) {
    'use strict';

    $('#list_container').zozoAccordion({
        orientation: "horizontal",
        height: 275,
        shadows: false,
        theme: "black",
        active: 0,
        sectionSpacing: 4
    });

    var bulkData;
    var instrumentData;
    var momentumData = "";
    var instrumentDataTimestamp;
    var oldInstrumentDataTimestamp;
    var correlationPeriods = {
        m1      : '',
        m5      : '',
        m15     : '',
        m60     : '',
        m1440   : '',
        m10080  : '',
        m43200  : ''
    };
    var tableCreated = false;
    var visible_instruments = [];
    var tool;
    var pack;

    var getMtfCookie = function() {
        return document.cookie.replace(/(?:(?:^|.*;\s*)mtf_investuit\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    };

    var setMtfCookie = function(status) {
        document.cookie = "mtf_investuit=" + status;
    };

    $('.filtering').click(function (e){

        setMtfCookie($(this).data('spec'));
        window.location.reload(false);

    });

    var setInitData = function(results){

        bulkData = results;

        pack = parsePackage(results.data[0].channel);

        var current = 'data';
        var exactData = results.data[0].data;

        if(pack === 'silver') {
            setMtfCookie('');
        }

        if(parseTool(results.data[0].channel) === "signals") {
            tool = 'signals';
            exactData.forEach(function(el) {
                if(el.id.indexOf('momentum') > -1) {
                    momentumData = $.parseJSON(el.content);
                } else if(el.id.indexOf('signals') > -1) {
                    instrumentData = $.parseJSON(el.content);
                    instrumentDataTimestamp = new Date();
                    oldInstrumentDataTimestamp = instrumentDataTimestamp;
                }
            });
        } else if(parseTool(results.data[0].channel) === 'heatmap'){
            instrumentData = results.data[0].data;
        }else if(parseTool(results.data[0].channel) === "correlation"){
            exactData.forEach(function(el) {
                correlationPeriods[el.id.split('_')[1]] = $.parseJSON(el.content);
            });
            instrumentData = results.data[0].data;
        }else if(parseTool(results.data[0].channel) !== 'mtf'){     // scalping, converter
            exactData.forEach(function(el) {
                if(el.id.indexOf('momentum') > -1) {
                    momentumData = $.parseJSON(el.content);
                } else if(el.id.indexOf(current) > -1) {
                    instrumentData = $.parseJSON(el.content);
                    instrumentDataTimestamp = new Date();
                    oldInstrumentDataTimestamp = instrumentDataTimestamp;
                }
            });
        }else {                                                     // mtf

            if(getMtfCookie() === '' || getMtfCookie() === 'filtered') {
                current = 'data';
                $('[data-spec=filtered]').addClass('active');
                setMtfCookie('filtered');
            }else if(getMtfCookie() === 'unfiltered') {
                current = 'unfiltered';
                $('[data-spec=unfiltered]').addClass('active');
             }

            exactData.forEach(function(el) {
                if(el.id.indexOf('momentum') > -1) {
                    momentumData = $.parseJSON(el.content);
                } else if(el.id.indexOf(current) > -1) {
                    instrumentData = $.parseJSON(el.content);
                    instrumentDataTimestamp = new Date();
                    oldInstrumentDataTimestamp = instrumentDataTimestamp;
                }
            });

        }   // else



        console.log('instrumentData: ', instrumentData, ' momentumData: ', momentumData);

    }; // setInitData end

    var signal_notifications = {
        count: 0,
        buy_instruments: [],
        sell_instruments: [],
        categories: [],
        forex_count: 0,
        forex_majors_count: 0,
        forex_minors_count: 0,
        forex_exotics_count: 0,
        metals_count: 0,
        commodities_count: 0,
        indices_count: 0,
        index_futures_count: 0,
        spot_indices_count: 0,
        stocks_count: 0,
        usshares_count: 0,
        ukshares_count: 0,
        frenchshares_count: 0,
        germanshares_count: 0
    };

    var notifications = {
        count: 0,
        buy_instruments: [],
        sell_instruments: [],
        categories: [],
        forex_count: 0,
        forex_majors_count: 0,
        forex_minors_count: 0,
        forex_exotics_count: 0,
        metals_count: 0,
        commodities_count: 0,
        indices_count: 0,
        index_futures_count: 0,
        spot_indices_count: 0,
        stocks_count: 0,
        usshares_count: 0,
        ukshares_count: 0,
        frenchshares_count: 0,
        germanshares_count: 0
    };

    var updateNotificationsSignals = function() {

        $('.notification.main').show();
        $('.notification.nav').show();

        signal_notifications.count = 0;
        signal_notifications.buy_instruments = [];
        signal_notifications.sell_instruments = [];
        signal_notifications.categories = [];
        signal_notifications.forex_count = 0;
        signal_notifications.forex_majors_count = 0;
        signal_notifications.forex_minors_count = 0;
        signal_notifications.forex_exotics_count = 0;
        signal_notifications.metals_count = 0;
        signal_notifications.commodities_count = 0;
        signal_notifications.indices_count = 0;
        signal_notifications.index_futures_count = 0;
        signal_notifications.spot_indices_count = 0;
        signal_notifications.stocks_count = 0;
        signal_notifications.usshares_count = 0;
        signal_notifications.ukshares_count = 0;
        signal_notifications.frenchshares_count = 0;
        signal_notifications.germanshares_count = 0;

        for(var category in instrumentData) {

            instrumentData[category].forEach(function(instrument) {
                if(instrument.bid > instrument.periods[3].magic_levels.ul_final    // Daily UL
                && instrument.periods[0].summary === "Buy"
                && instrument.periods[1].summary === "Buy"
                // && instrument.periods[2].summary === "Buy"
                ) {
                    signal_notifications.count++;
                    signal_notifications.buy_instruments.push(instrument);
                    if(signal_notifications.categories.indexOf(category) === -1) {
                        signal_notifications.categories.push(category);
                    }
                    if(category.indexOf('forex') !== -1) {
                        signal_notifications.forex_count++;
                        signal_notifications[category + "_count"]++;
                    } else if(category === "metals") {
                        signal_notifications.metals_count++;
                    } else if(category === "commodities") {
                        signal_notifications.commodities_count++;
                    } else if(category.indexOf('shares') !== -1 || category.indexOf('stocks') !== -1) {
                        signal_notifications.stocks_count++;
                        // signal_notifications[category + "_count"]++;
                    } else if(category.indexOf('index') !== -1 || category.indexOf('indices') == -1) {
                        signal_notifications.indices_count++;
                        // signal_notifications[category + "_count"]++;
                    }
                }

                if(instrument.bid < instrument.periods[3].magic_levels.ll_final    // Daily UL
                && instrument.periods[0].summary === "Sell"
                && instrument.periods[1].summary === "Sell"
                // && instrument.periods[2].summary === "Sell"
                ) {
                    signal_notifications.count++;
                    signal_notifications.sell_instruments.push(instrument);
                    if(signal_notifications.categories.indexOf(category) === -1) {
                        signal_notifications.categories.push(category);
                    }
                    if(category.indexOf('forex') !== -1) {
                        signal_notifications.forex_count++;
                        signal_notifications[category + "_count"]++;
                    } else if(category === "metals") {
                        signal_notifications.metals_count++;
                    } else if(category === "commodities") {
                        signal_notifications.commodities_count++;
                    } else if(category.indexOf('shares') !== -1 || category.indexOf('stocks') !== -1) {
                        signal_notifications.stocks_count++;
                    } else if(category.indexOf('index') !== -1 || category.indexOf('indices') !== -1) {
                        signal_notifications.indices_count++;
                    }
                }
            });
        }

        $('.notification.main').text(signal_notifications.count);

            if(signal_notifications.forex_count > 0) { $('.notification.forex').show().text(signal_notifications.forex_count); } else { $('.notification.forex').hide(); }
            if(signal_notifications.metals_count > 0){ $('.notification.metals').show().text(signal_notifications.metals_count); } else { $('.notification.metals').hide(); }
            if(signal_notifications.commodities_count > 0) { $('.notification.commodities').show().text(signal_notifications.commodities_count); } else { $('.notification.commodities').hide(); }
            if(signal_notifications.indices_count > 0) { $('.notification.futures').show().text(signal_notifications.indices_count); } else { $('.notification.futures').hide(); }
            if(signal_notifications.stocks_count > 0) { $('.notification.stocks').show().text(signal_notifications.stocks_count); } else { $('.notification.stocks').hide(); }

            if(signal_notifications.forex_majors_count > 0) { $('.notification.forex_majors').show().text(signal_notifications.forex_majors_count); } else { $('.notification.forex_majors').hide(); }
            if(signal_notifications.forex_minors_count > 0) { $('.notification.forex_minors').show().text(signal_notifications.forex_minors_count); } else { $('.notification.forex_minors').hide(); }
            if(signal_notifications.forex_exotics_count > 0) { $('.notification.forex_exotics').show().text(signal_notifications.forex_exotics_count); } else { $('.notification.forex_exotics').hide(); }

            if(signal_notifications.index_futures_count > 0) { $('.notification.index_futures').show().text(signal_notifications.index_futures_count); } else { $('.notification.index_futures').hide(); }
            if(signal_notifications.spot_indices_count > 0) { $('.notification.spot_indices').show().text(signal_notifications.spot_indices_count); } else { $('.notification.spot_indices').hide(); }

            if(signal_notifications.usshares_count > 0) { $('.notification.us_stocks').show().text(signal_notifications.usshares_count); } else { $('.notification.us_stocks').hide(); }
            if(signal_notifications.ukshares_count > 0) { $('.notification.uk_stocks').show().text(signal_notifications.ukshares_count); } else { $('.notification.uk_stocks').hide(); }
            if(signal_notifications.frenchshares_count > 0) { $('.notification.french_stocks').show().text(signal_notifications.frenchshares_count); } else { $('.notification.french_stocks').hide(); }
            if(signal_notifications.germanshares_count > 0) { $('.notification.german_stocks').show().text(signal_notifications.germanshares_count); } else { $('.notification.german_stocks').hide(); }

            $('.notification.instrument, .notification.bullish, .notification.bearish').show();
    };

    var updateNotifications = function() {


        $('.notification.nav').show();

        notifications.count = 0;
        notifications.buy_instruments = [];
        notifications.sell_instruments = [];
        notifications.categories = [];
        notifications.forex_count = 0;
        notifications.forex_majors_count = 0;
        notifications.forex_minors_count = 0;
        notifications.forex_exotics_count = 0;
        notifications.metals_count = 0;
        notifications.commodities_count = 0;
        notifications.indices_count = 0;
        notifications.index_futures_count = 0;
        notifications.spot_indices_count = 0;
        notifications.stocks_count = 0;
        notifications.usshares_count = 0;
        notifications.ukshares_count = 0;
        notifications.frenchshares_count = 0;
        notifications.germanshares_count = 0;

        for(var category in instrumentData) {

            instrumentData[category].forEach(function(instrument) {
                if(instrument.bid > instrument.periods[4].magic_levels.ul_final    // Daily UL
                && instrument.bid > instrument.periods[5].magic_levels.ul_final    // Weekly UL
                && instrument.bid > instrument.periods[6].magic_levels.ul_final    // Monthly UL
                && instrument.periods[0].price_analysis === "Overbought"
                && instrument.periods[1].price_analysis === "Overbought"
                && instrument.periods[2].price_analysis === "Overbought"
                && instrument.periods[0].ichimoku.ichimoku_class == "buy"
                && instrument.periods[1].ichimoku.ichimoku_class == "buy"
                && instrument.periods[2].ichimoku.ichimoku_class == "buy"
                && instrument.periods[0].summary === "Buy"
                && instrument.periods[1].summary === "Buy"
                && instrument.periods[2].summary === "Buy"
                ) {
                    notifications.count++;
                    if(getMtfCookie() === 'filtered') {
                        notifications.buy_instruments.push(instrument);
                        if(notifications.categories.indexOf(category) === -1) {
                            notifications.categories.push(category);
                        }
                        if(category.indexOf('forex') !== -1) {
                            notifications.forex_count++;
                            notifications[category + "_count"]++;
                        } else if(category === "metals") {
                            notifications.metals_count++;
                        } else if(category === "commodities") {
                            notifications.commodities_count++;
                        } else if(category.indexOf('shares') !== -1) {
                            notifications.stocks_count++;
                            notifications[category + "_count"]++;
                        } else if(category.indexOf('index') !== -1 || category.indexOf('indices')) {
                            notifications.indices_count++;
                            notifications[category + "_count"]++;
                        }
                    }
                }

                if(instrument.bid < instrument.periods[4].magic_levels.ll_final    // Daily UL
                && instrument.bid < instrument.periods[5].magic_levels.ll_final    // Weekly UL
                && instrument.bid < instrument.periods[6].magic_levels.ll_final    // Monthly UL
                && instrument.periods[0].price_analysis === "Oversold"
                && instrument.periods[1].price_analysis === "Oversold"
                && instrument.periods[2].price_analysis === "Oversold"
                && instrument.periods[0].ichimoku.ichimoku_class == "sell"
                && instrument.periods[1].ichimoku.ichimoku_class == "sell"
                && instrument.periods[2].ichimoku.ichimoku_class == "sell"
                && instrument.periods[0].summary === "Sell"
                && instrument.periods[1].summary === "Sell"
                && instrument.periods[2].summary === "Sell"
                ) {
                    notifications.count++;
                    if(getMtfCookie() === 'filtered') {
                        notifications.sell_instruments.push(instrument);
                        if(notifications.categories.indexOf(category) === -1) {
                            notifications.categories.push(category);
                        }
                        if(category.indexOf('forex') !== -1) {
                            notifications.forex_count++;
                            notifications[category + "_count"]++;
                        } else if(category === "metals") {
                            notifications.metals_count++;
                        } else if(category === "commodities") {
                            notifications.commodities_count++;
                        } else if(category.indexOf('shares') !== -1) {
                            notifications.stocks_count++;
                            notifications[category + "_count"]++;
                        } else if(category.indexOf('index') !== -1 || category.indexOf('indices')) {
                            notifications.indices_count++;
                            notifications[category + "_count"]++;
                        }
                    }
                }
            });
        }

        $('.notification.main').text(notifications.count);

        if(getMtfCookie() === 'filtered') {

            $('.notification.main').show();

            if(notifications.forex_count > 0) { $('.notification.forex').show().text(notifications.forex_count); } else { $('.notification.forex').hide(); }
            if(notifications.metals_count > 0){ $('.notification.metals').show().text(notifications.metals_count); } else { $('.notification.metals').hide(); }
            if(notifications.commodities_count > 0) { $('.notification.commodities').show().text(notifications.commodities_count); } else { $('.notification.commodities').hide(); }
            if(notifications.indices_count > 0) { $('.notification.futures').show().text(notifications.indices_count); } else { $('.notification.futures').hide(); }
            if(notifications.stocks_count > 0) { $('.notification.stocks').show().text(notifications.stocks_count); } else { $('.notification.stocks').hide(); }

            if(notifications.forex_majors_count > 0) { $('.notification.forex_majors').show().text(notifications.forex_majors_count); } else { $('.notification.forex_majors').hide(); }
            if(notifications.forex_minors_count > 0) { $('.notification.forex_minors').show().text(notifications.forex_minors_count); } else { $('.notification.forex_minors').hide(); }
            if(notifications.forex_exotics_count > 0) { $('.notification.forex_exotics').show().text(notifications.forex_exotics_count); } else { $('.notification.forex_exotics').hide(); }

            if(notifications.index_futures_count > 0) { $('.notification.index_futures').show().text(notifications.index_futures_count); } else { $('.notification.index_futures').hide(); }
            if(notifications.spot_indices_count > 0) { $('.notification.spot_indices').show().text(notifications.spot_indices_count); } else { $('.notification.spot_indices').hide(); }

            if(notifications.usshares_count > 0) { $('.notification.us_stocks').show().text(notifications.usshares_count); } else { $('.notification.us_stocks').hide(); }
            if(notifications.ukshares_count > 0) { $('.notification.uk_stocks').show().text(notifications.ukshares_count); } else { $('.notification.uk_stocks').hide(); }
            if(notifications.frenchshares_count > 0) { $('.notification.french_stocks').show().text(notifications.frenchshares_count); } else { $('.notification.french_stocks').hide(); }
            if(notifications.germanshares_count > 0) { $('.notification.german_stocks').show().text(notifications.germanshares_count); } else { $('.notification.german_stocks').hide(); }

            $('.notification.instrument, .notification.bullish, .notification.bearish').show();
        } else {
            $('.notification.forex').hide();
            $('.notification.metals').hide();
            $('.notification.commodities').hide();
            $('.notification.stocks').hide();

            $('.notification.forex_majors').hide();
            $('.notification.forex_minors').hide();
            $('.notification.forex_exotics').hide();

            $('.notification.index_futures').hide();
            $('.notification.spot_indices').hide();

            $('.notification.us_stocks').hide();
            $('.notification.uk_stocks').hide();
            $('.notification.french_stocks').hide();
            $('.notification.german_stocks').hide();

            $('.notification.instrument, .notification.bullish, .notification.bearish').hide();
        }
    };

    var updateCurrentData = function(results){

        bulkData = results;
        var current;

        if(parseTool(results.channel) === "signals") {
            results.data.forEach(function(el) {
                if(el.id.indexOf('momentum') > -1) {
                    momentumData = $.parseJSON(el.content);
                } else if(el.id.indexOf(current) > -1) {
                    instrumentData = $.parseJSON(el.content);
                    instrumentDataTimestamp = new Date();
                    oldInstrumentDataTimestamp = instrumentDataTimestamp;
                }
            });
        } else if(parseTool(results.channel) === 'heatmap'){
            instrumentData = results.data;
        }else if(parseTool(results.channel) === 'correlation'){
            for(var i in results.data){
                correlationPeriods[results.data[i].id.split('_')[1]] = $.parseJSON(results.data[i].content);
            }
        }else if(parseTool(results.channel) !== 'mtf') {
            for(var i in results.data){
                if(results.data[i].id.indexOf('momentum') > -1){
                    momentumData = $.parseJSON(results.data[i].content);
                }else if(results.data[i].id.indexOf('data') > -1){
                    instrumentData = $.parseJSON(results.data[i].content);
                    instrumentDataTimestamp = new Date();
                }
            } // for end
        } else {

            if(getMtfCookie() === '' || getMtfCookie() === 'filtered') {
                current = 'data';
                setMtfCookie('filtered');
            }else if(getMtfCookie() === 'unfiltered') {
                current = 'unfiltered';
             }

            results.data.forEach(function(el) {
                if(el.id.indexOf('momentum') > -1) {
                    momentumData = $.parseJSON(el.content);
                } else if(el.id.indexOf(current) > -1) {
                    instrumentData = $.parseJSON(el.content);
                    instrumentDataTimestamp = new Date();
                    oldInstrumentDataTimestamp = instrumentDataTimestamp;
                }
            });

        } // else

    }; // updateCurrentData end

    var destroyAccordion = function(tab, $clicked_object) {
        $('#accordion-' + tab).find('h3, div').remove();
    }; // destroy accordion end

    var createAccordion = function(tab, $clicked_object) {

        // remove accordion items from current category
        for (var i in instrumentData[tab]) {
            $('#accordion-' + tab).find('h3.accordion_table_header, div.accordion_table_wrapper').remove();
        }

        var note = "";

        // if there are filtered instruments
        if (instrumentData[tab].length > 0) {
            $('.info.' + tab).hide();

            if (!$clicked_object.hasClass('ui-tabs-active')          // dont add instruments to accordion if clicked tab doesnt have active class
                || $('#accordion-' + tab).children().length === 0) {     // OR if there are no accordion elements - important for first go
                for (var i in instrumentData[tab]) {

                    if(pack === 'platinum' || pack === 'gold') {

                        if(notifications.buy_instruments.length || notifications.sell_instruments.length) {

                            if(notifications.buy_instruments.indexOf(instrumentData[tab][i]) !== -1) {
                                note = '<span class="notification instrument">!</span><span class="notification bullish">Market Analysis Summary: 15M, 30M, 1H: Bullish</span>';
                            } else if(notifications.sell_instruments.indexOf(instrumentData[tab][i]) !== -1) {
                                note = '<span class="notification instrument">!</span><span class="notification bearish">Market Analysis Summary: 15M, 30M, 1H: Bearish</span>';
                            } else {
                                note = '';
                            }

                        } else if(signal_notifications.buy_instruments.indexOf(instrumentData[tab][i]) !== -1) {
                            note = '<span class="notification instrument">!</span><span class="notification bullish">Market Analysis Summary: 15M, 30M: Bullish</span>';
                        } else if(signal_notifications.sell_instruments.indexOf(instrumentData[tab][i]) !== -1) {
                            note = '<span class="notification instrument">!</span><span class="notification bearish">Market Analysis Summary: 15M, 30M: Bearish</span>';
                        } else {
                            note = '';
                        }

                    } else {
                        note = '';
                    }

                    $('#accordion-' + tab).append('<h3 class="accordion_table_header" data-symbol=' + instrumentData[tab][i].class_name + ' data-category=' + tab + ' >' + instrumentData[tab][i].name + '' + note +'</h3><div class="accordion_table_wrapper ' + instrumentData[tab][i].class_name + ' ' + tab + '"></div>');
                }
                $('#accordion-' + tab).accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
                $('#accordion-' + tab).accordion('refresh');
            }
        } else {
            $('.info.' + tab).show();
        }

    }; // createAccordion end

    var createInstrumentTable = function(instrument, category) {

        var $table_tool;
        $table_tool = $('table.tool').html();
        var simbol;
        var current;
        var i;

        if ($('div.' + instrument + '.' + category).find('table').length === 0) {
            $('div.' + instrument + '.' + category).append('<table class="' + category + ' ' + instrument + ' instrument" data-symbol="' + instrument + '" data-category="' + category + '">' + $table_tool + '</table>');
        }


        for (i in instrumentData[category]) {
            if (instrumentData[category][i].class_name === instrument) {
                simbol = instrumentData[category][i].class_name;
                current = instrumentData[category][i];
                if(tool === 'signals') {
                    populateSignalsTable(simbol, current, category);
                } else {
                    populateSingleTable(simbol, current);
                }
            }
        }

        //updateMomentum();
    };

    var populateSingleTable = function(simbol, current) {

        var periods = ['15', '30', '60', '240', '1440', '10080', '43200'];
        var i;

        $('table.' + simbol).find('.instrument_name').text(current.name);
        $('table.' + simbol).find('.exchange_rate').text(current.bid);
        $('table.' + simbol).find('.high_price').text(current.daily_high);
        $('table.' + simbol).find('.low_price').text(current.daily_low);
        $('table.' + simbol).find('.change_daily').text(current.daily_change + " %");
        if (current.daily_change > 0) {
            $('table.' + simbol).find('.change_daily').removeClass("buy sell").addClass("buy");
        } else if (current.daily_change < 0) {
            $('table.' + simbol).find('.change_daily').removeClass("buy sell").addClass("sell");
        }

        for (var j in periods) {

            $('table.' + simbol).find('.' + periods[j] + '_summary').text(current.periods[j].summary);
            $('table.' + simbol).find('.' + periods[j] + '_summary').removeClass('buy sell neutral').addClass(current.periods[j].summary.toLowerCase());

            $('table.' + simbol).find('.' + periods[j] + '_technical_indicators').text(current.periods[j].indicators.end_description);
            $('table.' + simbol).find('.' + periods[j] + '_technical_indicators').removeClass('strong_buy buy strong_sell sell strong_neutral neutral').addClass(current.periods[j].indicators.end_class);

            $('table.' + simbol).find('.' + periods[j] + '_moving_averages').text(current.periods[j].moving_average.ma_mark_description);
            $('table.' + simbol).find('.' + periods[j] + '_moving_averages').removeClass('super_strong_buy super_strong_sell strong_buy buy strong_sell sell strong_neutral neutral').addClass(current.periods[j].moving_average.ma_class);

            $('table.' + simbol).find('.' + periods[j] + '_price_analysis').text(current.periods[j].price_analysis);
            $('table.' + simbol).find('.' + periods[j] + '_price_analysis').removeClass('strong_buy buy strong_sell sell strong_neutral neutral overbought oversold').addClass(current.periods[j].price_analysis.toLowerCase());

            $('table.' + simbol).find('.' + periods[j] + '_volatility').text(current.periods[j].volatility);

            $('table.' + simbol).find('.' + periods[j] + '_ichimoku').text(current.periods[j].ichimoku.ichimoku_mark_description);
            $('table.' + simbol).find('.' + periods[j] + '_ichimoku').removeClass('strong_buy buy strong_sell sell strong_neutral neutral').addClass(current.periods[j].ichimoku.ichimoku_class);

            $('table.' + simbol).find('.' + periods[j] + '_time').text(current.time);

            // Magic Levels
            if (periods[j] >= 240) {
                $('table.' + simbol).find('.' + periods[j] + '_r4').text(current.periods[j].magic_levels.r4_final);
                $('table.' + simbol).find('.' + periods[j] + '_r3').text(current.periods[j].magic_levels.r3_final);
                $('table.' + simbol).find('.' + periods[j] + '_r2').text(current.periods[j].magic_levels.r2_final);
                $('table.' + simbol).find('.' + periods[j] + '_r1').text(current.periods[j].magic_levels.r1_final);
                $('table.' + simbol).find('.' + periods[j] + '_upper_level').text(current.periods[j].magic_levels.ul_final);
                $('table.' + simbol).find('.' + periods[j] + '_lower_level').text(current.periods[j].magic_levels.ll_final);
                $('table.' + simbol).find('.' + periods[j] + '_s1').text(current.periods[j].magic_levels.s1_final);
                $('table.' + simbol).find('.' + periods[j] + '_s2').text(current.periods[j].magic_levels.s2_final);
                $('table.' + simbol).find('.' + periods[j] + '_s3').text(current.periods[j].magic_levels.s3_final);
                $('table.' + simbol).find('.' + periods[j] + '_s4').text(current.periods[j].magic_levels.s4_final);

                $('table.' + simbol).find('.' + periods[j] + '_hilo').data('high', current.extremes[periods[j] + '_high']);
                $('table.' + simbol).find('.' + periods[j] + '_hilo').data('low', current.extremes[periods[j] + '_low']);

                // Resistance levels
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_r1').text()) <= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('high'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_r1').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_r2').text()) <= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('high'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_r2').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_r3').text()) <= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('high'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_r3').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_r4').text()) <= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('high'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_r4').addClass('reached_level');
                }

                // Support levels
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_s1').text()) >= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('low'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_s1').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_s2').text()) >= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('low'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_s2').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_s3').text()) >= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('low'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_s3').addClass('reached_level');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_s4').text()) >= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('low'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_s4').addClass('reached_level');
                }

                // No trade zone
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_upper_level').text()) <= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('high'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_upper_level').addClass('reached_trade_zone');
                }
                if (parseFloat($('table.' + simbol).find('.' + periods[j] + '_lower_level').text()) >= parseFloat($('table.' + simbol).find('.' + periods[j] + '_hilo').data('low'))) {
                    $('table.' + simbol).find('.' + periods[j] + '_lower_level').addClass('reached_trade_zone');
                }


            }// if end
        }// for end

    }; // populateSingleTable

    var destroySingleTable = function(symbol) {
        //$('table.' + symbol).remove(); // treba unaprediti logiku kada se brzo klikce po instrumentima
    };

    var updateMomentum = function(tool){

        var results = momentumData;
        var i, j;
        var simbol;
        var current_time = new Date();

        switch(tool){
            case 'mtf':
                for(i in results){
                    for(j in results[i]){
                        simbol = results[i][j].symbol.toLowerCase();
                        if(results[i][j].momentum.toLowerCase() === "down"){
                            $('table.' + simbol).find('.momentum').removeClass("up down").addClass("down");
                            $('table.' + simbol).find('.instrument_name').removeClass("buy sell").addClass("sell");
                            $('table.' + simbol).find('.exchange_rate').text(results[i][j].bid).removeClass("buy sell").addClass("sell");

                        }else{
                            $('table.' + simbol).find('.momentum').removeClass("up down").addClass("up");
                            $('table.' + simbol).find('.instrument_name').removeClass("buy sell").addClass("buy");
                            $('table.' + simbol).find('.exchange_rate').text(results[i][j].bid).removeClass("buy sell").addClass("buy");
                        }

                        // If current price is higher than highest
                        if(parseFloat($('table.' + simbol + ' .high_price').text()) < parseFloat($('table.' + simbol + ' .exchange_rate').text()) ){
                            $('table.' + simbol + ' .high_price').text(results[i][j].bid);
                        }
                        // If current price is lower than lowest
                        if(parseFloat($('table.'+ simbol +' .low_price').text()) > parseFloat($('table.' + simbol + ' .exchange_rate').text()) ){
                            $('table.' + simbol +' .low_price').text(results[i][j].bid);
                        }
                    } // for j end
                } // for i end
            break;
        }
    };  // updateMomentum end



    function mapDate(date) {
        var dan = date.getDate();
        var mesec = date.getMonth() + 1;

        if (dan < 10) {
            dan = "0" + dan;
        }
        if (mesec < 10) {
            mesec = "0" + mesec;
        }

        return dan + "." + mesec + "." + date.getFullYear() + ".";
    }

    function mapTime(t_time) {
        return t_time < 10 ? '0' + t_time : t_time;
    };

    var parsePackage = function(channel) {
        return channel.replace('wl_10trade_', '').split('_')[1];
    };

    var parseTool = function(channel) {
        return channel.replace('wl_10trade_', '').split('_')[2];
    };

    var createTable = function(data, channel){

        var _package = parsePackage(channel);
        var _tool = parseTool(channel);

        switch(_tool){
            // binary / scalping
            case 'binary':
                createBinaryTable(_package);
                break;
            // multitimeframe
            case 'mtf':
                createMtfTable(_package);
                break;
            case 'signals':
                createSignalsTable(_package);
                break;
            case 'converter':
                createConverterTable();
                break;
            case 'heatmap':
                createHeatmapTable();
                break;
            case 'correlation':
                createCorrelationTable();
                break;
        }

        tableCreated = true;

    }; // createTable end

    var updateTable = function(data, channel){

        var _package = parsePackage(channel);
        var _tool = parseTool(channel);

        switch(_tool){
            // binary / scalping
            case 'binary': updateBinaryTable(_package);
                break;
            // multitimeframe
            case 'mtf': updateMtfTable(_package);
                        updateNotifications(data);
                break;
            case 'signals': updateSignalsTable(_package);
                        updateNotificationsSignals();
                break;
            case 'converter': updateConverterTable();
                break;
            case 'heatmap': updateHeatmapTable();
                break;
            case 'correlation': updateCorrelationTable();
                break;
        }

    }; // updateTable end

/************************************ CONVERTER START *************************************/

    var createConverterTable = function(){
        $('body').on('mouseenter','table#converter td.cells', function(){
            var _this = $(this);
            var idx = _this.index() - 1;
            $('tr').each(function(){
                $(this).find('td.cells:eq(' + idx + ')').addClass('hovered');
            });
        });
        $('body').on('mouseleave','table#converter td.cells', function(){
            $('td.hovered').removeClass('hovered');
        });

        var current;
        var current2;

        var currencies = ["EUR","USD","GBP","CHF","JPY","AUD","CAD","NZD"];

        for(var i in currencies){
            current = currencies[i].toLowerCase();
            $('table#converter tbody').append('<tr class="' + current + '"><td>' + currencies[i] + '</td></tr>');
            $('table#converter thead tr').append('<th class="' + current + '">' + currencies[i] + '</th>');

            for(var j in currencies){
                current2 = currencies[j].toLowerCase();
                $('tr.' + current).append('<td class="cells ' + current + current2 + '" data-pair="' + current + '_' + current2 + '"></td>');
            }
        }

        $('.analysis').show();
        $('.loading').hide();
        updateConverterTable();
    };

    var updateConverterTable = function(){
        var current;

        $('table#converter td.cells').each(function(){
            var _this = $(this);
            var simbol1 = _this.data('pair').split('_')[0];
            var simbol2 = _this.data('pair').split('_')[1];

            if(simbol1 !== simbol2){
                for(var i in instrumentData.converter){
                    if(instrumentData.converter[i].instrument.toLowerCase() === (simbol1 + simbol2)){
                        _this.text(instrumentData.converter[i].price);
                        $('td.' + simbol2 + simbol1).text((1/parseFloat(instrumentData.converter[i].price)).toFixed(4));
                    }
                }
            }else{
                _this.text('1');
            }

        });
    };

/********************************** CONVERTER END **************************************/

/********************************** SIGNALS START **************************************/
var populateSignalsTable = function(simbol, current, category) {

        var periods = ['15', '30', '60', '1440'];
        var i;

        function fillMagicLevels(period) {

            var magic_levels = current.periods.reduce(function(agg, p) {
                if(p.period_indicators === period) {
                    Object.assign(agg, p.magic_levels);
                }

                return agg;
            }, {});

            $('table.' + simbol).find('.magic_r3').text(magic_levels.r3_final);
            $('table.' + simbol).find('.magic_r2').text(magic_levels.r2_final);
            $('table.' + simbol).find('.magic_r1').text(magic_levels.r1_final);
            $('table.' + simbol).find('.magic_upper_level').text(magic_levels.ul_final);
            $('table.' + simbol).find('.magic_lower_level').text(magic_levels.ll_final);
            $('table.' + simbol).find('.magic_s1').text(magic_levels.s1_final);
            $('table.' + simbol).find('.magic_s2').text(magic_levels.s2_final);
            $('table.' + simbol).find('.magic_s3').text(magic_levels.s3_final);

        }

        function markReachedLevels(period) {

            $('table.' + simbol).find('.magic_hilo').data('high', current.extremes[period + '_high']);
            $('table.' + simbol).find('.magic_hilo').data('low', current.extremes[period + '_low']);

            // Resistance levels
            if (parseFloat($('table.' + simbol).find('.magic_r1').text()) <= parseFloat($('table.' + simbol).find('.magic_hilo').data('high'))) {
                $('table.' + simbol).find('.magic_r1').addClass('reached_level');
            }
            if (parseFloat($('table.' + simbol).find('.magic_r2').text()) <= parseFloat($('table.' + simbol).find('.magic_hilo').data('high'))) {
                $('table.' + simbol).find('.magic_r2').addClass('reached_level');
            }
            if (parseFloat($('table.' + simbol).find('.magic_r3').text()) <= parseFloat($('table.' + simbol).find('.magic_hilo').data('high'))) {
                $('table.' + simbol).find('.magic_r3').addClass('reached_level');
            }

            // Support levels
            if (parseFloat($('table.' + simbol).find('.magic_s1').text()) >= parseFloat($('table.' + simbol).find('.magic_hilo').data('low'))) {
                $('table.' + simbol).find('.magic_s1').addClass('reached_level');
            }
            if (parseFloat($('table.' + simbol).find('.magic_s2').text()) >= parseFloat($('table.' + simbol).find('.magic_hilo').data('low'))) {
                $('table.' + simbol).find('.magic_s2').addClass('reached_level');
            }
            if (parseFloat($('table.' + simbol).find('.magic_s3').text()) >= parseFloat($('table.' + simbol).find('.magic_hilo').data('low'))) {
                $('table.' + simbol).find('.magic_s3').addClass('reached_level');
            }

            // No trade zone
            if (parseFloat($('table.' + simbol).find('.magic_upper_level').text()) <= parseFloat($('table.' + simbol).find('.magic_hilo').data('high'))) {
                $('table.' + simbol).find('.magic_upper_level').addClass('reached_trade_zone');
            }
            if (parseFloat($('table.' + simbol).find('.magic_lower_level').text()) >= parseFloat($('table.' + simbol).find('.magic_hilo').data('low'))) {
                $('table.' + simbol).find('.magic_lower_level').addClass('reached_trade_zone');
            }
        }

        $('table.' + simbol).find('.instrument_name').text(current.name);
        $('table.' + simbol).find('.exchange_rate').text(current.bid);

        $('table.' + simbol).find('.change_daily').text(current.daily_change + " %");
        if (current.daily_change > 0) {
            $('table.' + simbol).find('.change_daily').removeClass("buy sell").addClass("buy");
        } else if (current.daily_change < 0) {
            $('table.' + simbol).find('.change_daily').removeClass("buy sell").addClass("sell");
        }

        for (var j in periods) {

            if(current.periods[j].summary === "Buy" || current.periods[j].summary === "Strong Buy") {
                $('table.' + simbol).find('.' + periods[j] + '_summary').text('').removeClass('up down').addClass('up');
            }
            else if(current.periods[j].summary === "Sell" || current.periods[j].summary === "Strong Sell") {
                $('table.' + simbol).find('.' + periods[j] + '_summary').text('').removeClass('up down').addClass('down');
            } else {
                $('table.' + simbol).find('.' + periods[j] + '_summary').text('-').removeClass('up down');
            }

            $('table.' + simbol).find('.' + periods[j] + '_time').text(current.time);

            // Use Weekly levels
            if(category.indexOf('forex') === -1) {

                fillMagicLevels('10080');   // Weekly
                markReachedLevels('10080');

            } else {

                fillMagicLevels('1440');    // Daily
                markReachedLevels('1440');
            }

        }// for end

    }; // populateSignalsTable

var createSignalsTable = function(pack) {

    pack = 'platinum';  // To be addressed with other packages

    $('#tab-container').tabs();

    // Create top level accordion
    switch(pack){
        case 'silver':
            $('#accordion-forex').accordion({
                collapsible: true,
                active: false,
                heightStyle: 'panel'
            });
        case 'gold':
            $('#accordion-forex').accordion({
                collapsible: true,
                active: false,
                heightStyle: 'panel'
            });
            break;
        case 'platinum':
            $('#accordion-forex').accordion({
                collapsible: true,
                active: false,
                heightStyle: 'panel'
            });
            break;
    } // switch end

        //--------------

    $('.analysis').show();
    $('.loading').hide();

}

var updateSignalsTable = function(_package){

        var simbol;
        var current;
        var instrument;
        var i, j;
        var count;
        var forRemoval = [];
        var category;
        var activeInstruments = [];
        var categories = [];

        if(_package === 'platinum'){

            // Azurirati samo otvorenu podkategoriju ili tab
            if(($('.aktivan_top_header').length > 0
            && oldInstrumentDataTimestamp < instrumentDataTimestamp) // ovo bi trebalo da spreci osvezavanje na osvezavanje momentuma, samo kad stignu novi podaci
            || ($('.aktivan_tab').length > 0
            && oldInstrumentDataTimestamp < instrumentDataTimestamp)){

                // Ali ne treba ubijati sve instrumente jer mozda je otvorena neki
                $('.aktivan_top_header').each(function(){
                    var _this = $(this);
                    category = _this.attr('id');
                    categories.push(category);

                    $('#accordion-' + category).find('.accordion_table_header').each(function(){

                        count = 0;

                        // Proveriti da li je tabela otvorena za trenutni instrument
                        if($(this).hasClass('aktivan_header')){
                            for(i in instrumentData[category]){
                                if(instrumentData[category][i].class_name === $(this).data('symbol')){
                                    count++;
                                }
                            }

                            // Ako ga nema u najsvezijim podacima izbaciti ga
                            if(count === 0){
                                forRemoval.push($(this));
                                forRemoval.push($(this).next('div.accordion_table_wrapper'));
                            }else{
                                activeInstruments.push($(this).data('symbol'));
                            }
                        }else{
                            forRemoval.push($(this));
                            forRemoval.push($(this).next('div.accordion_table_wrapper'));
                        }

                    });

                });

                // Metals & Commodities
                // Ali ne treba ubijati sve instrumente jer mozda je otvorena neki

                if($('.aktivan_tab').length > 0
                && ($('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'metals'
                || $('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'commodities'
                || $('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'indices'
                || $('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'stocks')){

                    category = $('.aktivan_tab').find('a').attr('href').replace('#tabs-','');
                    categories.push(category);

                    $('#accordion-' + category).find('.accordion_table_header').each(function(){

                        count = 0;

                        // Proveriti da li je tabela otvorena za trenutni instrument
                        if($(this).hasClass('aktivan_header')){
                            for(i in instrumentData[category]){
                                if(instrumentData[category][i].class_name === $(this).data('symbol')){
                                    count++;
                                }
                            }

                            // Ako ga nema u najsvezijim podacima izbaciti ga
                            if(count === 0){
                                forRemoval.push($(this));
                                forRemoval.push($(this).next('div.accordion_table_wrapper'));
                            }else{
                                activeInstruments.push($(this).data('symbol'));
                            }
                        }else{
                            forRemoval.push($(this));
                            forRemoval.push($(this).next('div.accordion_table_wrapper'));
                        }

                    });
                }

                // console.log("Za brisanje: ", forRemoval);

                // remove everything
                for(i in forRemoval){
                    forRemoval[i].remove();
                }

                // Popuni sve ponovo
                for(var k in categories){
                    if(instrumentData[categories[k]].length > 0){ // Ako ima instrumenata uopste
                        $('.info.' + categories[k]).hide();
                        for(i in instrumentData[categories[k]]){
                            if(activeInstruments.indexOf(instrumentData[categories[k]][i].class_name) === -1 ){
                                $('#accordion-' + categories[k]).append('<h3 class="accordion_table_header" data-symbol=' + instrumentData[categories[k]][i].class_name + ' data-category=' + categories[k] + ' >' + instrumentData[categories[k]][i].name + '</h3><div class="accordion_table_wrapper ' + instrumentData[categories[k]][i].class_name + ' ' + categories[k] + '"></div>');
                            }
                        }
                    }else{
                        $('.info.' + categories[k]).show();
                    }
                    // console.log("Kategorija: ", categories[k]);
                    if($('#accordion-' + categories[k]).hasClass('ui-accordion')){
                        $('#accordion-' + categories[k]).accordion('refresh');
                    }
                }
            } // if end
        } // if package === 3, platinum samo


        oldInstrumentDataTimestamp = instrumentDataTimestamp;

        $('table.instrument').each(function(){
            instrument = $(this).data('symbol');
            for(category in instrumentData){
                for(j in instrumentData[category]){
                    if(instrumentData[category][j].class_name === instrument){
                        simbol = instrumentData[category][j].class_name;
                        current = instrumentData[category][j];
                        populateSignalsTable(simbol, current, category);
                    }
                }
            }

        }); // table each end
        updateMomentum('mtf');

    }; // updateMftTable end

/********************************** SIGNALS END **************************************/

/********************************** MULTITIMEFRAME START *********************************/

    var createMtfTable = function(pack){

        $('#tab-container').tabs();

        // Create top level accordions
        switch(pack){
            case 'silver':
                $('#accordion-forex').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
            case 'gold':
            case 'platinum':
                $('#accordion-forex').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
                $('#accordion-indices').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
                $('#accordion-stocks').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
                break;
        } // switch end

        //--------------

        $('.analysis').show();
        $('.loading').hide();

    }; // createMftTable end

    var updateMtfTable = function(_package){

        var simbol;
        var current;
        var instrument;
        var i, j;
        var count;
        var forRemoval = [];
        var category;
        var activeInstruments = [];
        var categories = [];

        if(_package === 'platinum' || _package === 'gold'){

            // Azurirati samo otvorenu podkategoriju ili tab
            if(($('.aktivan_top_header').length > 0
            && oldInstrumentDataTimestamp < instrumentDataTimestamp) // ovo bi trebalo da spreci osvezavanje na osvezavanje momentuma, samo kad stignu novi podaci
            || ($('.aktivan_tab').length > 0
            && oldInstrumentDataTimestamp < instrumentDataTimestamp)){

                // Ali ne treba ubijati sve instrumente jer mozda je otvorena neki
                $('.aktivan_top_header').each(function(){
                    var _this = $(this);
                    category = _this.attr('id');
                    categories.push(category);

                    $('#accordion-' + category).find('.accordion_table_header').each(function(){

                        count = 0;

                        // Proveriti da li je tabela otvorena za trenutni instrument
                        if($(this).hasClass('aktivan_header')){
                            for(i in instrumentData[category]){
                                if(instrumentData[category][i].class_name === $(this).data('symbol')){
                                    count++;
                                }
                            }

                            // Ako ga nema u najsvezijim podacima izbaciti ga
                            if(count === 0){
                                forRemoval.push($(this));
                                forRemoval.push($(this).next('div.accordion_table_wrapper'));
                            }else{
                                activeInstruments.push($(this).data('symbol'));
                            }
                        }else{
                            forRemoval.push($(this));
                            forRemoval.push($(this).next('div.accordion_table_wrapper'));
                        }

                    });

                });

                // Metals & Commodities
                // Ali ne treba ubijati sve instrumente jer mozda je otvorena neki

                if($('.aktivan_tab').length > 0
                && ($('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'metals'
                || $('.aktivan_tab').find('a').attr('href').replace('#tabs-','') === 'commodities')){

                    category = $('.aktivan_tab').find('a').attr('href').replace('#tabs-','');
                    // console.log("CAT: ", category);
                    categories.push(category);

                    $('#accordion-' + category).find('.accordion_table_header').each(function(){

                        count = 0;

                        // Proveriti da li je tabela otvorena za trenutni instrument
                        if($(this).hasClass('aktivan_header')){
                            for(i in instrumentData[category]){
                                if(instrumentData[category][i].class_name === $(this).data('symbol')){
                                    count++;
                                }
                            }

                            // Ako ga nema u najsvezijim podacima izbaciti ga
                            if(count === 0){
                                forRemoval.push($(this));
                                forRemoval.push($(this).next('div.accordion_table_wrapper'));
                            }else{
                                activeInstruments.push($(this).data('symbol'));
                            }
                        }else{
                            forRemoval.push($(this));
                            forRemoval.push($(this).next('div.accordion_table_wrapper'));
                        }

                    });
                }

                // console.log("Za brisanje: ", forRemoval);

                // remove everything
                for(i in forRemoval){
                    forRemoval[i].remove();
                }

                // Popuni sve ponovo
                for(var k in categories){
                    if(instrumentData[categories[k]].length > 0){ // Ako ima instrumenata uopste
                        $('.info.' + categories[k]).hide();
                        for(i in instrumentData[categories[k]]){
                            if(activeInstruments.indexOf(instrumentData[categories[k]][i].class_name) === -1 ){
                                $('#accordion-' + categories[k]).append('<h3 class="accordion_table_header" data-symbol=' + instrumentData[categories[k]][i].class_name + ' data-category=' + categories[k] + ' >' + instrumentData[categories[k]][i].name + '</h3><div class="accordion_table_wrapper ' + instrumentData[categories[k]][i].class_name + ' ' + categories[k] + '"></div>');
                            }
                        }
                    }else{
                        $('.info.' + categories[k]).show();
                    }
                    // console.log("Kategorija: ", categories[k]);
                    if($('#accordion-' + categories[k]).hasClass('ui-accordion')){
                        $('#accordion-' + categories[k]).accordion('refresh');
                    }
                }
            } // if end
        } // if package === 3, platinum samo


        oldInstrumentDataTimestamp = instrumentDataTimestamp;

        $('table.instrument').each(function(){
            instrument = $(this).data('symbol');
            for(i in instrumentData){
                for(j in instrumentData[i]){
                    if(instrumentData[i][j].class_name === instrument){
                        simbol = instrumentData[i][j].class_name;
                        current = instrumentData[i][j];
                        populateSingleTable(simbol, current);
                    }
                }
            }

        }); // table each end
        updateMomentum('mtf');

    }; // updateMftTable end

/**************************** MULTITIMEFRAME END *******************************/

/**************************** CORRELATION START *******************************/
var toggleInstruments = function(instrument_name, checked){

    var _index;
    var current;
    var current2;

    current = instrument_name.trim().replace(/ /g , '').replace(/&/g, '').replace(/-/g,'').toLowerCase();

    // ne postoji instrument u tabeli
    if(!$('tr.' + current).length && checked){

        visible_instruments.push(instrument_name);

        $('table.correlation tbody tr').each(function(){
            $(this).append('<td class="cells ' + current + '_' +  $(this).attr('class') + '"></td>');
        });

        $('table.correlation tbody').append('<tr class="' + current + '"><td>' + instrument_name.toUpperCase() + '</td></tr>');
        $('table.correlation thead tr').append('<th class="' + current + '">' + instrument_name.toUpperCase() + '</th>');

        for(var j in visible_instruments){
            current2 = visible_instruments[j].replace(/ /g,'').replace(/&/g, '').replace(/-/g,'').toLowerCase();
            $('tr.' + current).append('<td class="cells ' + current2 + '_' + current + '"></td>');
        }
    }else{
        visible_instruments.splice(visible_instruments.indexOf(instrument_name), 1);

        $('table.correlation tr.' + current).remove();
        $('table.correlation thead th.' + current).remove();
        $('table.correlation td.cells').each(function(){
            if($(this).attr('class').indexOf(current) > -1){
                $(this).remove();
            }
        });

    }

    updateCorrelationTable($('.ui-tabs-active a').attr('href').split('#tabs-')[1]);

}; // toggleInstruments end

var updateCorrelationTable = function(period){

    var current;
    var results;

    if(period !== undefined){
        results = correlationPeriods[period];
    }else{
        results = correlationPeriods[$('.tab.ui-state-active').find('a').attr('href').split('-')[1]];
        period = $('.tab.ui-state-active').find('a').attr('href').split('-')[1];
    }

    for(var i in results.correlation){
        current = results.correlation[i].combination.replace(/ /g, '').replace(/&/g, '').replace(/-/g,'').toLowerCase();

        $('table.' + period + ' td.' + current).text(results.correlation[i].value);

        /* Define level of correlation and background color */
        if(parseFloat(results.correlation[i].value) >= 0.75){
            $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('highest_positive');
        }
        else if(parseFloat(results.correlation[i].value) >= 0.20 && parseFloat(results.correlation[i].value) < 0.75){
            $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('high_positive');
        }
        else if(parseFloat(results.correlation[i].value) >= -0.20 && parseFloat(results.correlation[i].value) < 0.20){
            $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('neutral');
        }
        else if(parseFloat(results.correlation[i].value) <= -0.20 && parseFloat(results.correlation[i].value) > -0.75){
            $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('high_negative');
        }
        else if(parseFloat(results.correlation[i].value) <= -0.75){
            $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('highest_negative');
        }
        // -2 edge case
        if(parseFloat(results.correlation[i].value) == -2) {
             $('table.' + period + ' td.' + current).removeClass('high_positive highest_positive neutral high_negative highest_negative').addClass('neutral');
             $('table.' + period + ' td.' + current).text("N/A");
        }
    } // for end
}; // updateCorrelationTable end

var initialPopulateTable = function(period){

    if(!$('table.' + period).hasClass('initiated')){
        updateCorrelationTable(period);
        $('table.' + period).addClass('initiated');
    } // if end
    else{
        updateCorrelationTable(period);
    }

}; // initialPopulateTable

var createCorrelationTable = function(){

    $('#tab-container').tabs(); // init tabs

    // event listener for tabs
    $('.tab').click(function(){
        var tf = $(this).find('a').attr('href').replace('#tabs-','');
        initialPopulateTable(tf);
    });

    $('body').on('change','input.category', function(){
        var category = $(this).attr('id');
        switch(category){
            case 'forex_majors':
                if($(this).prop('checked')){
                    $('ul.forex_majors input:not(:checked)').click();
                }else{
                    $('ul.forex_majors input:checked').click();
                }
                break;
            case 'forex_minors':
                if($(this).prop('checked')){
                    $('ul.forex_minors input:not(:checked)').click();
                }else{
                    $('ul.forex_minors input:checked').click();
                }
                break;
            case 'metals':
                if($(this).prop('checked')){
                    $('ul.metals input:not(:checked)').click();
                }else{
                    $('ul.metals input:checked').click();
                }
                break;
            case 'commodities':
                if($(this).prop('checked')){
                    $('ul.commodities input:not(:checked)').click();
                }else{
                    $('ul.commodities input:checked').click();
                }
                break;
            case 'index_futures':
                if($(this).prop('checked')){
                    $('ul.index_futures input:not(:checked)').click();
                }else{
                    $('ul.index_futures input:checked').click();
                }
                break;
            case 'spot_indices':
                if($(this).prop('checked')){
                    $('ul.spot_indices input:not(:checked)').click();
                }else{
                    $('ul.spot_indices input:checked').click();
                }
                break;
        }// switch end

    });

    // checkbox list of instruments
    $('body').on('change','ul.instrument_list input[type=checkbox]', function(){
        var _this = $(this);
        var checked = _this.prop('checked');
        var instrument = _this.next('label').text().trim(); //_this.attr('class');
        toggleInstruments(instrument, checked);
    });

    // Radio button group for switching between heatmap + values / heatmap / values
    $('body').on('change', '#state input', function(){
        switchVisualCorrelation($(this).val());
    });

    var current;
    var current2;
    var count = 0;
    var results;
    var i, j, k, t;

    for(var k in instrumentData){
        if(instrumentData[k].id === "correlation_categories"){
            results = $.parseJSON(instrumentData[k].content);
            for(i in results){
                for(j in results[i]){
                    count++;
                    current = results[i][j].replace(/ /g , '').replace(/&/g, '').replace(/-/g,'').toLowerCase();

                    if(i === "forex_majors" && count <= 6){
                        visible_instruments.push(results[i][j]);
                        $('ul.instrument_list.' + i).append('<li><input type="checkbox" checked="checked" class="' + current + '" id="' + current + '" /><label for="' + current + '"> ' + results[i][j] + '</label></li>');
                    }else{
                        $('ul.instrument_list.' + i).append('<li><input type="checkbox" class="' + current + '" id="' + current + '" /><label for="' + current + '"> ' + results[i][j] + '</label></li>');
                    }
                } // for j end
            } // for i end
        }

        if(instrumentData[k].id === "correlation_symbols"){
            results = $.parseJSON(instrumentData[k].content);

            for(i in visible_instruments){

                current = visible_instruments[i].replace(/ /g , '').replace(/&/g, '').replace(/-/g,'').toLowerCase();
                $('table.correlation tbody').append('<tr class="' + current + '"><td>' + visible_instruments[i].toUpperCase() + '</td></tr>');
                $('table.correlation thead tr').append('<th class="' + current + '">' + visible_instruments[i].toUpperCase() + '</th>');

                for(j in visible_instruments){
                    current2 = visible_instruments[j].replace(/ /g,'').replace(/&/g, '').replace(/-/g,'').toLowerCase();
                    $('tr.' + current).append('<td class="cells ' + current2 + '_' + current + '"></td>');
                }

            } // for end
        } // if end
    } // for k end

    $('.loading_data').hide();
    $('.loading').hide();
    $('.analysis').show();
    updateCorrelationTable('m1');
    switchVisualCorrelation($('#state input:checked').val());

}; // createCorrelationTable end

var switchVisualCorrelation = function(type){
    switch(type){
        case 'all':
            $('td.cells').removeClass('highest_positive_bgr high_positive_bgr neutral_bgr high_negative_bgr highest_negative_bgr highest_positive_font high_positive_font neutral_font high_negative_font highest_negative_font');
            break;
        case 'heatmap':
            $('td.cells').removeClass('highest_positive_font high_positive_font neutral_font high_negative_font highest_negative_font')
                .each(function(){
                    if($(this).attr('class').indexOf('highest_positive') > -1){
                        $(this).addClass('highest_positive_bgr');
                    }
                    else if($(this).attr('class').indexOf('high_positive') > -1){
                        $(this).addClass('high_positive_bgr');
                    }
                    else if($(this).attr('class').indexOf('neutral') > -1){
                        $(this).addClass('neutral_bgr');
                    }
                    else if($(this).attr('class').indexOf('high_negative') > -1){
                        $(this).addClass('high_negative_bgr');
                    }
                    else if($(this).attr('class').indexOf('highest_negative') > -1){
                        $(this).addClass('highest_negative_bgr');
                    }
                });
            break;
        case 'values':
            $('td.cells').removeClass('highest_positive_bgr high_positive_bgr neutral_bgr high_negative_bgr highest_negative_bgr')
            .each(function(){
                if($(this).attr('class').indexOf('highest_positive') > -1){
                    $(this).addClass('highest_positive_font');
                }
                else if($(this).attr('class').indexOf('high_positive') > -1){
                    $(this).addClass('high_positive_font');
                }
                else if($(this).attr('class').indexOf('neutral') > -1){
                    $(this).addClass('neutral_font');
                }
                else if($(this).attr('class').indexOf('high_negative') > -1){
                    $(this).addClass('high_negative_font');
                }
                else if($(this).attr('class').indexOf('highest_negative') > -1){
                    $(this).addClass('highest_negative_font');
                }
            });
            break;
    } // switch end
}; // switchVisual end

/**************************** CORRELATION END *******************************/


/**************************** HEATMAP START ************************************/
var createHeatmapTable = function(){

    // Radio button group for switching between heatmap + values / heatmap / values
    $('body').on('change', '#state input', function(){
        switchVisualHeatmap($(this).val());
    });

    var current;
    var current2;

    var currencies = ["EUR","USD","GBP","CHF","JPY","AUD","CAD","NZD"];

    for(var i in currencies){
        current = currencies[i].toLowerCase();
        $('table.heatmap tbody').append('<tr class="' + current + '"><td>' + currencies[i] + '</td></tr>');
        $('table.heatmap thead tr').append('<th class="' + current + '">' + currencies[i] + '</th>');

        for(var j in currencies){
            current2 = currencies[j].toLowerCase();
            $('tr.' + current).append('<td class="cells ' + current + current2 + '" data-pair="' + current + '_' + current2 + '"></td>');
        }
    }

    $('#tab-container').tabs(); // init tabs
    $('.analysis').show();
    $('.loading').hide();

    updateHeatmapTable();
}; // createHeatmapTable

var updateHeatmapTable = function(){
    var current;
    var period;
    var results;

    for(var i in instrumentData){

        period = instrumentData[i].id.split('_')[1];
        results = $.parseJSON(instrumentData[i].content);
        $('table.' + period + ' td.cells').each(function(){
            var _this = $(this);
            var simbol1 = _this.data('pair').split('_')[0];
            var simbol2 = _this.data('pair').split('_')[1];

            if(simbol1 !== simbol2){
                for(var j in results.heatmap){
                    if(results.heatmap[j].instrument.toLowerCase() === (simbol1 + simbol2)){
                        _this.removeClass('strong_buy strong_sell buy sell neutral').addClass(results.heatmap[j].summary).text(results.heatmap[j].volatility + '%');
                        $('table.' + period + ' td.' + simbol2 + simbol1).removeClass('strong_buy strong_sell buy sell neutral').addClass(invertClass(results.heatmap[j].summary)).text(results.heatmap[j].volatility + '%');
                    }
                }
            }else{
                _this.text('1');
            }

        });
    }

    switchVisualHeatmap($('#state input:checked').val());
}; // updateHeatmapTable end

var invertClass = function(instrument_class){
    var _class;
    switch(instrument_class){
        case 'strong_buy':
            _class = 'strong_sell';
            break;
        case 'buy':
            _class = 'sell';
            break;
        case 'sell':
            _class = 'buy';
            break;
        case 'strong_sell':
            _class = 'strong_buy';
            break;
        default:
            _class = 'neutral';
    }

    return _class;
};

var switchVisualHeatmap = function(type){
    switch(type){
        case 'all':
            $('td.cells').removeClass('strong_buy_font strong_buy_bgr buy_font buy_bgr neutral_font neutral_bgr sell_font sell_bgr strong_sell_font strong_sell_bgr');
            break;
        case 'heatmap':
            $('td.cells').removeClass('strong_buy_font buy_font neutral_font sell_font strong_sell_font')
                .each(function(){
                    if($(this).attr('class').indexOf('strong_buy') > -1){
                        $(this).addClass('strong_buy_bgr');
                    }
                    else if($(this).attr('class').indexOf('buy') > -1){
                        $(this).addClass('buy_bgr');
                    }
                    else if($(this).attr('class').indexOf('neutral') > -1){
                        $(this).addClass('neutral_bgr');
                    }
                    else if($(this).attr('class').indexOf('strong_sell') > -1){
                        $(this).addClass('strong_sell_bgr');
                    }
                    else if($(this).attr('class').indexOf('sell') > -1){
                        $(this).addClass('sell_bgr');
                    }

                });
            break;
        case 'values':
            $('td.cells').removeClass('strong_buy_bgr buy_bgr neutral_bgr sell_bgr strong_sell_bgr')
            .each(function(){
                if($(this).attr('class').indexOf('strong_buy') > -1){
                    $(this).addClass('strong_buy_font');
                }
                else if($(this).attr('class').indexOf('buy') > -1){
                    $(this).addClass('buy_font');
                }
                else if($(this).attr('class').indexOf('neutral') > -1){
                    $(this).addClass('neutral_font');
                }
                else if($(this).attr('class').indexOf('strong_sell') > -1){
                    $(this).addClass('strong_sell_font');
                }
                else if($(this).attr('class').indexOf('sell') > -1){
                    $(this).addClass('sell_font');
                }

            });
            break;
    } // switch end
}; // switchVisual end
/**************************** HEATMAP END ************************************/


/*************************** SCALPING START **********************************/
var createBinaryTable = function(pack){

        var i, j;

        $('#tab-container').tabs();
        $('#accordion-forex').accordion({
            collapsible: true,
            active: false,
            heightStyle: 'panel'
        });

        switch(pack){
            case 'platinum':
            case 'gold':
                $('#accordion-indices').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });

                $('#accordion-stocks').accordion({
                    collapsible: true,
                    active: false,
                    heightStyle: 'panel'
                });
        } // switch end

        $('.analysis').show();
        $('.tab-container').show();
        $('.loading').hide();

        var results = instrumentData;

        for(i in results){
            for(j in results[i]){
                $('table.' + i +  ' tbody').append('<tr class="' + results[i][j].class_name + '">\
                                            <td class="symbol">' + results[i][j].name + '</td>\
                                            <td class="' + results[i][j].class_name + '_price">' + results[i][j].bid + '</td>\
                                            <td class="' + results[i][j].class_name + '_momentum ' + results[i][j].momentum.toLowerCase() + '"></td>\
                                            <td class="' + results[i][j].class_name + '_reversal ' + results[i][j].reversal.toLowerCase() + '"></td>\
                                            <td class="' + results[i][j].class_name + '_time"></td>\
                                            <td class="' + results[i][j].class_name + '_date"></td>\
                                        </tr>');
            } // for j end
        } // for i end

    }; // createBinaryTable end

var updateBinaryTable = function(pack){

        var broker_offset;
        var local_offset;
        var broker_time;
        var display_time;
        var future;
        var symbol_time;
        var current_time = new Date;

        broker_time = current_time.getTime();

        local_offset = new Date;
        local_offset = local_offset.getTimezoneOffset() / 60;
        broker_offset = 3;

        display_time = new Date( (broker_time + ((local_offset + broker_offset)) + (local_offset-1) * 3600) * 1000);

        $('table.scalping').each(function(){
            $(this).find('th.current_time').text(("0" + current_time.getHours()).slice(-2) + ":" + ("0" + current_time.getMinutes()).slice(-2) + ":" + ("0" + current_time.getSeconds()).slice(-2));
        });

        var results = instrumentData;

        for(var i in results){
            for(var j in results[i]){
                symbol_time = new Date((parseInt(results[i][j].time) + local_offset + broker_offset + local_offset * 3600) * 1000);
                $('table td.'+ results[i][j].class_name + '_price').text(results[i][j].bid);
                $('table td.'+ results[i][j].class_name + '_momentum').removeClass('up down').addClass(results[i][j].momentum.toLowerCase());
                $('table td.'+ results[i][j].class_name + '_reversal').removeClass('true false').addClass(results[i][j].reversal.toLowerCase());
                //$('table td.'+ results[i][j].class_name + '_trade').removeClass('true false').addClass(results[i][j].trade.toLowerCase());
                $('table td.'+ results[i][j].class_name + '_time').text(mapTime(symbol_time.getHours()) + ":" + mapTime(symbol_time.getMinutes()));
                $('table td.'+ results[i][j].class_name + '_date').text(mapDate(symbol_time));
            }
        }

    }; // updateBinaryTable end

/************************************* SCALPING END *****************************************************/


/************************************* EVENT LISTENERS START ************************************************************/



    if($('.my_target_calculator').length > 0) {

        (function() {

            var capital;
            var leverage_percent;
            var performance_requested;

            var formatNumber = function(num) {

                var stotine;
                var hiljade;

                if(num % 1000 < 10) {
                    stotine = "00" + (num % 1000).toFixed(0);
                } else if(num % 1000 < 100) {
                    stotine = "0" + (num % 1000).toFixed(0);
                } else {
                    stotine = (num % 1000).toFixed(0);
                }

                if(num >= 1000 && num < 1000000) {

                    return parseInt(num / 1000) + "," + stotine;

                } else if(num >= 1000000) {

                    if(num % 1000000 < 10000) {
                        hiljade = "00" + ((num % 1000000) / 1000).toFixed(0);
                    } else if(num % 1000000 < 100000) {
                        hiljade = "0" + ((num % 1000000) / 1000).toFixed(0);
                    } else {
                        hiljade = ((num % 1000000) / 1000).toFixed(0);
                    }

                    return parseInt(num / 1000000) + "," + hiljade + "," + stotine;

                } else {
                    return parseInt(num);
                }
            };

            var calculate = function() {

                capital = parseFloat($('.capital').val());
                leverage_percent = parseFloat($('.leverage').val());
                performance_requested = parseFloat($('.performance_requested').val());

                var exposure = 0;
                var pipValue = 0;
                var pipsMontly = 0;
                var pipsDaily = 0;

                var yearlyPerformance = 0;
                var yearlyPerformanceExcluding = 0;

                var totalWithdrawals = 0;
                var withdrawalsToDeposit = 0;

                var montlyPerfomance = 0;
                var montlyPerfomanceIncluding = 0;
                var montlyPerfomanceExcluding = 0;

                var previousMontlyPerformance = 0;
                var previousMontlyPerformanceIncluding = 0;
                var previousMontlyPerformanceExcluding = 0;

                for(var i = 1; i < 13; i++) {
                    if(i === 1) {
                        previousMontlyPerformance = capital;
                    }
                    montlyPerfomance = previousMontlyPerformance * (performance_requested/100) + previousMontlyPerformance;

                    if(i === 1) {
                        montlyPerfomanceIncluding = (montlyPerfomance - capital)/2;
                        montlyPerfomanceExcluding = previousMontlyPerformance + montlyPerfomanceIncluding;
                    } else {
                        montlyPerfomanceIncluding = (previousMontlyPerformanceExcluding * (performance_requested/100)) / 2;
                        montlyPerfomanceExcluding = previousMontlyPerformanceExcluding + montlyPerfomanceIncluding;
                    }

                    montlyPerfomance = Number.isNaN(montlyPerfomance) ? 0 : montlyPerfomance;
                    montlyPerfomanceIncluding = Number.isNaN(montlyPerfomanceIncluding) ? 0 : montlyPerfomanceIncluding;
                    montlyPerfomanceExcluding = Number.isNaN(montlyPerfomanceExcluding) ? 0 : montlyPerfomanceExcluding;

                    $("." + i + '_month_performance').text("$ " + formatNumber(montlyPerfomance));
                    $("." + i + '_month_inc_withdrawal').text("$ " + formatNumber(montlyPerfomanceIncluding));
                    $("." + i + '_month_exc_withdrawal').text("$ " + formatNumber(montlyPerfomanceExcluding));

                    previousMontlyPerformance = montlyPerfomance;
                    previousMontlyPerformanceIncluding = montlyPerfomanceIncluding;
                    previousMontlyPerformanceExcluding = montlyPerfomanceExcluding;
                }

                exposure = Number.isNaN(capital * leverage_percent) ? 0 : capital * leverage_percent;
                pipValue = exposure/10000;
                pipsMontly = Number.isNaN((capital * (performance_requested/100))/(exposure/10000)) ? 0 : (capital * (performance_requested/100))/(exposure/10000);
                pipsMontly = pipsMontly === Infinity ? 0 : pipsMontly;
                pipsDaily = pipsMontly/20.5;

                $('.exposure').text(formatNumber(exposure));
                $('.pip_value').text("$ " + pipValue.toFixed(1));
                $('.pips_needed_monthly').text(pipsMontly.toFixed(0));
                $('.pips_needed_daily').text(pipsDaily.toFixed(0));
                $('.target_yearly').text((pipsMontly*12).toFixed(0));
                $('.target_montly').text((pipsMontly).toFixed(0));
                $('.target_daily').text(pipsDaily.toFixed(0));
                $('.stoploss').text((pipsDaily * 3).toFixed(0));

                yearlyPerformance = ((parseFloat($('.12_month_performance').text().split('$')[1].replace(/,/g,''))/capital) * 100) - 100;
                yearlyPerformance = Number.isNaN(yearlyPerformance) ? 0 : yearlyPerformance;

                yearlyPerformanceExcluding = ((parseFloat($('.12_month_exc_withdrawal').text().split('$')[1].replace(/,/g,''))/capital) * 100) - 100;
                yearlyPerformanceExcluding = Number.isNaN(yearlyPerformanceExcluding) ? 0 : yearlyPerformanceExcluding;

                $('.yearly_performance').text((yearlyPerformance).toFixed(2) + "%");
                $('.yearly_performance_exc_withdrawal').text((yearlyPerformanceExcluding).toFixed(2) + "% Plus");

                for(var i = 1; i < 13; i++) {
                    totalWithdrawals += parseFloat($('.' + i + "_month_inc_withdrawal").text().split('$')[1].replace(/,/g,''));
                }

                $('.total_withdrawals').text("$ " + formatNumber(totalWithdrawals));

                withdrawalsToDeposit = (totalWithdrawals/capital) * 100;
                withdrawalsToDeposit = Number.isNaN(withdrawalsToDeposit) ? 0 : withdrawalsToDeposit;

                $('.withdrawals_to_deposit').text(withdrawalsToDeposit.toFixed(2) + "%");
            };

            $('#tab-container').tabs();

            // Accept only digits for inputs
            $('.my_target_calculator input').on('input', function() {
                this.value = this.value.replace(/[^0-9.]/g, '');
                this.value = this.value.replace(/(\..*)\./g, '$1');
            });


            $('.leverage').on('input', function() {

                if($('.capital').val().length > 0 && $('.performance_requested').val().length > 0) {
                    calculate();
                }
            });

            $('.capital').on('input', function() {
                if($('.leverage').val().length > 0 && $('.performance_requested').val().length > 0) {
                    calculate();
                }
            });

            $('.performance_requested').on('input', function() {

                performance_requested = $(this).val() === '' ? 0 : parseFloat($(this).val());
                var percentage = performance_requested === '' ? 0 : parseFloat(performance_requested)/2;

                //$('.position_leverage_percent').text(performance_requested + "%");
                $('.half_leverage_percent').text(percentage + "%");

                if($('.leverage').val().length > 0 && $('.capital').val().length > 0) {
                    calculate();
                }
            });


        })();

    }

    if($('.fibo_calculator').length > 0) {

        (function() {

            var calculateFiboUp = function() {

                var highUpward = parseFloat($('.up_high').val());
                var lowUpward = parseFloat($('.up_low').val());

                var currentConstant = 0;
                var currentLevel = 0;

                for(var i = 1; i < 11; i++) {

                    currentConstant = parseFloat($('.' + i + "_level").text().split('%')[0]) / 100;
                    currentLevel = highUpward - ((highUpward - lowUpward) * currentConstant);
                    currentLevel = Number.isNaN(currentLevel) ? 0 : currentLevel;

                    $('.' + i + '_up').text(currentLevel.toFixed(4));
                }

            };

            var calculateFiboDown = function() {

                var highDownward = parseFloat($('.down_high').val());
                var lowDownward = parseFloat($('.down_low').val());

                var currentConstant = 0;
                var currentLevel = 0;

                for(var i = 1; i < 11; i++) {

                    currentConstant = parseFloat($('.' + i + "_level").text().split('%')[0]) / 100;

                    currentLevel = lowDownward + ((highDownward - lowDownward) * currentConstant);
                    currentLevel = Number.isNaN(currentLevel) ? 0 : currentLevel;

                    $('.' + i + '_down').text(currentLevel.toFixed(4));
                }

            };

            $('.fibo_calculator input').on('input', function() {
                this.value = this.value.replace(/[^0-9.]/g, '');
                this.value = this.value.replace(/(\..*)\./g, '$1');
            });

            $('.up_high').on('input', function() {
                if($('.down_high').val().length > 0) {
                    calculateFiboUp();
                }
            });

            $('.up_low').on('input', function() {
                if($('.up_high').val().length > 0) {
                    calculateFiboUp();
                }
            });

            $('.down_high').on('input', function() {
                if($('.down_low').val().length > 0) {
                    calculateFiboDown();
                }
            });

            $('.down_low').on('input', function() {
                if($('.down_high').val().length > 0) {
                    calculateFiboDown();
                }
            });

        })();

    }

    // Tabs for metals and commodities
    $('body').on('click', '.tab', function() {
        var _this = $(this);
        var currentTab = _this.find('a').attr('href').replace('#tabs-', '');
        if (currentTab === "metals" || currentTab === "commodities" || currentTab === "indices" || currentTab === "stocks") {

            $('.tab').each(function() {
                //debugger;
                if ($(this).find('a').attr('href').replace('#tabs-', '') !== _this.find('a').attr('href').replace('#tabs-', '')) {
                    $(this).removeClass('aktivan_tab');
                }
            });

            $(this).toggleClass('aktivan_tab');

            if ($(this).hasClass('aktivan_tab') && $(this).hasClass('tab')) {
                createAccordion(currentTab, $(this));
            }

        }
    });

    // Inner accordions
    $('body').on('click', 'h3.top_level', function() {
        var _this = $(this);
        var currentTab = _this.attr('id');

        $('.top_level').each(function() {
            if ($(this).attr('id') !== _this.attr('id')) {
                $(this).removeClass('aktivan_top_header');
            }
        });

        //_this.addClass('aktivan_top_header');
        _this.toggleClass('aktivan_top_header');

        if (!_this.hasClass('aktivan_top_header') && _this.hasClass('top_level')) {
            destroyAccordion(currentTab);
        } else {
            createAccordion(currentTab, _this);
        }
        //_this.toggleClass('aktivan_top_header');
    });

    // Single instrument accordion
    $('body').on('click', 'h3.accordion_table_header', function() {
        if ($(this).hasClass('aktivan_header')) {
            destroySingleTable($(this).data('symbol'));
        } else {
            createInstrumentTable($(this).data('symbol'), $(this).data('category'));
        }
        $(this).toggleClass('aktivan_header');
    });

/**************************************************** EVENT LISTENRERS END *******************************************************/

    return Marionette.Object.extend({
        onInitialUpdate: function(data) {
            // console.log("onInitialUpdate: ", data);
            setInitData(data);
            if (!tableCreated) {
                var _channel = data.data[0].channel;
                createTable(data, _channel);
            }
        },
        onUpdate: function(data) {
            // console.log("onUpdate: ", data);
            var _channel = data.channel;
            updateCurrentData(data);
            updateTable(data, _channel);
        }
    });
});
