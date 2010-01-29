var lingcod = (function(){

    var options = {};
    var that = {};
    
    that.init = function(opts){
        options = opts;
        that.options = opts;
        
        $('#sidebar').tabs();
        resize();
        google.earth.createInstance(
            "map", 
            function(i){
                geInit(i);
            },
            function(code){
                geFailure(code);
            });
        setupListeners();
        lingcod.menu_items.init($('.menu_items'));
        // makes button clicking a lot more reliable!!
        $(document).find('a.button').live('dragstart', function(){
            return false;
        });
    };

    var geInit = function(pluginInstance){
        ge = pluginInstance;
        ge.getWindow().setVisibility(true); // required
        ge.getOptions().setStatusBarVisibility(true);
        ge.getNavigationControl().setVisibility(ge.VISIBILITY_AUTO);
        gex = new GEarthExtensions(ge);
        
        // that.googleLayers = new lingcod.map.googleLayers(ge, 
        //     $('#ge_options'), $('#ge_layers'));
        that.geocoder = new lingcod.map.geocoder(gex, $('#flyToLocation'));
        that.measureTool = new lingcod.measureTool();
                
        $('#measure_distance').click(function(){
            that.measureTool.clear();
            that.measureTool.measureDistance(gex, "measureAmount");
            $('#measure_clear').removeClass('disabled');
            $('#measureAmountHolder').show();
        });
        $('#measure_area').click(function(){
            that.measureTool.clear();
            that.measureTool.measureArea(gex, "measureAmount");
            $('#measure_clear').removeClass('disabled');
            $('#measureAmountHolder').show();
        });
        $('#measure_clear').click(function(){
            that.measureTool.clear();
            $(this).addClass('disabled');
            $('#measureAmountHolder').hide();
        });
        $('#measure_units').change(function(){
            that.measureTool.setUnits($(this).val());
        });
        
        $('#datalayerstree').append('<div id="study_region"></div><div id="public_data"></div><div id="ecotrust_data"></div>');

        var studyRegion = lingcod.kmlTree({
            url: window.studyregion,
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map'), 
            element: $('#study_region'),
            trans: options.media_url + 'common/images/transparent.gif',
            title: true,
            restoreState: true
        });
        if(!setCameraFromLocalStorage()){
            $(studyRegion).bind('kmlLoaded', function(){
                $('#study_region').find('li').dblclick();
            });            
        }
        studyRegion.load();

        var publicData = lingcod.kmlTree({
            url: window.public_data_layers,
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map'), 
            element: $('#public_data'),
            trans: options.media_url + 'common/images/transparent.gif',
            title: true,
            restoreState: true
        });
        publicData.load();
        
        // var forest = lingcod.kmlForest({
        //     element: $('#datalayerstree'),
        //     ge: ge,
        //     gex: gex,
        //     div: $('#map')
        // });
        // 
        // forest.add(window.studyregion, {
        //     cachebust: true,
        //     callback: function(kmlObject, topNode){
        //         topNode.find('> ul > li > a').trigger('dblclick');            
        //     }
        // });
        // 
        // forest.add(window.public_data_layers, {
        //     cachebust: true
        // });
        
        var panel = lingcod.panel({appendTo: $('#panel-holder'), 
            showCloseButton: false});
            
        that.client = lingcod.rest.client(gex, panel);
        
        if(typeof options.form_shown === 'function'){
            $(that.client).bind('form_shown', options.form_shown);
        }
        
        if(options.ecotrust){
            var ecotrustData = lingcod.kmlTree({
                url: options.ecotrust,
                ge: ge, 
                gex: gex, 
                animate: false, 
                map_div: $('#map'), 
                element: $('#ecotrust_data'),
                trans: options.media_url + 'common/images/transparent.gif',
                title: true,
                restoreState: true
            });
            ecotrustData.load();
        }
        
        var editors = [];
        
        if(options.myshapes){
            for(var i=0;i<options.myshapes.length; i++){
                editors.push(lingcod.rest.kmlEditor({
                    ge: ge,
                    gex: gex,
                    appendTo: '#myshapestree',
                    div: '#map',
                    url: options.myshapes[i],
                    client: that.client
                }));
            }            
        }

        if(options.sharedshapes){
            for(var i=0;i<options.sharedshapes.length; i++){
                editors.push(lingcod.rest.kmlEditor({
                    ge: ge,
                    gex: gex,
                    appendTo: '#sharedshapestree',
                    div: '#map',
                    url: options.sharedshapes[i],
                    client: that.client
                }));
            }            
        }
        
        $('#sidebar, #meta-navigation').click(function(e){
            if(e.target === this || e.target === $('#MyShapes')[0]){
                for(var i=0;i<editors.length;i++){
                    editors[i].clearSelection();
                }
            }
        });
        
        var url = that.options.media_url + 'common/kml/shadow.kmz';
        google.earth.fetchKml(ge, url, function(k){
            ge.getFeatures().appendChild(k);
        });
    };
    
    var studyRegionLoaded = function(kmlObject, node){
        // Reorder so studyRegion is on top of the list
        $('#datalayerstree').prepend(node);
        if (kmlObject.getAbstractView()){
            ge.getView().setAbstractView(kmlObject.getAbstractView());
        }   
    };
    
    var geFailure = function(errorCode){
        alert("Failure loading the Google Earth Plugin: " + errorCode);
    }
    
    var setupListeners = function(){
        $(window).smartresize(function(){
            resize();
        });
        $('#meta-navigation').click(function(){
            lingcod.menu_items.closeAll();
        });
        $('#sidebar').bind('mouseup', function(e){
            lingcod.menu_items.closeAll();
            return false;
        });
        $('#sidebar-mask').click(function(){
            lingcod.menu_items.closeAll();
        });
    };
    
    var resize = function(){
        var mh = $('#meta-navigation').outerHeight();
        var h = $(document.body).height() - mh;
        $('#sidebar').css({top: mh, height: h});
        $('#panel-holder').css({top: mh, height: h});
        
        var w = $(document.body).width() - $('#sidebar').width();
        $('#map_container').height(h).width(w);
    };
    
    that.maskSidebar = function(){
        $('#panel-holder').show();
        $('#sidebar').addClass('masked');
    };
    
    that.unmaskSidebar = function(){
        $('#panel-holder').hide();
        $('#sidebar').removeClass('masked');
    };
    
    var panels = [];
    
    that.addPanel = function(panel){
        panels.push(panel);
        $(panel).bind('panelshow', onPanelShown);
        $(panel).bind('panelhide', onPanelHide);
        $(panel).bind('panelclose', onPanelHide);
    },
    
    that.removePanel = function(panel){
        panels.remove(panel);
        $(panel).unbind('panelshow', onPanelShown);
        $(panel).unbind('panelhide', onPanelHide);
        $(panel).unbind('panelclose', onPanelHide);
    };
    
    var onPanelShown = function(e, panel){
        that.maskSidebar();
    };
    
    var onPanelHide = function(e, panel){
        var count = 0;
        for(var i=0; i<panels.length; i++){
            var p = panels[i];
            if(p.shown){
                count++;
            }
        }
        if(count > 0){
            // console.log('another panel still shown');
        }else{
            that.unmaskSidebar();
        }
    };
    
    var setCameraToLocalStorage = function(){
        if(!!window.localStorage){
            localStorage.setItem('marinemap-camera', gex.view.serialize());
        }
    };
    
    var setCameraFromLocalStorage = function(){
        if(!!window.localStorage && localStorage.getItem('marinemap-camera')){
            gex.view.deserialize(localStorage.getItem('marinemap-camera'));
            return true;
        }
        return false;
    };
    
    $(window).unload(function(){
        setCameraToLocalStorage();
    });

    return that;
})();
