!   Map MapDemo

    script MapDemo

    div Panel
    div Controls
    div MapPanel
    span Span
    gmap Map
    variable Latitude
    variable Longitude
    variable Zoom

    put `53.8291119` into Latitude
    put `-1.5381586` into Longitude
    put `17.0` into Zoom
    
    create Panel
    set the style of Panel to
    	`width:100%;height:100%;display:flex;flex-direction:column`
    
    create Controls in Panel
    set the style of Controls to `height:3em;padding:4px`
    create Span in Controls
    set the style of Span to `font-size:120%`
    set the content of Span to `Festival locations map`
    
    create MapPanel in Panel
    set the style of MapPanel to `width:100%;flex:1`
    
    create Map in  MapPanel
    set the key of Map to reverse `oDoY9QznCO0vIousvNrJa28K0Oe5iFyOBySazIA`
    set the latitude of Map to Latitude
    set the longitude of Map to Longitude
    set the zoom of Map to Zoom
    show Map

    stop
