!   doclets.ecs - the Doclet UI

    script Doclets

!    debug compile

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Doclet query system

    div Body
    div TitleBanner
    div DebugRow
    div TopicList
    div TopicsDialogMask
    div TopicsDialogList
    div TopicItemTemplate
    div TopicItemTemplateRow
    div NewDocletDialogMask
    div NewDocletDialogList
    div NewTopicItemTemplate
    div DocletViewMask
    div DocletViewContent
    textarea DocletEditText
    div DocletListPanel
    button ChooseTopicsButton
    button SendQueryButton
    button NewDocletButton
    button TopicsDialogSelectAll
    button TopicsDialogDeselectAll
    button TopicsDialogOK
    button DocletViewEdit
    button DocletViewDelete
    button DocletViewSave
    button DocletViewClose
    button NewDocletCancel
    button NewTopicButton
    button DocletButton
    input QueryInput
    input TopicCheckbox

    topic MyTopic
    topic ServerTopic
    variable FernetToken
    variable FernetKey
    variable MyID
    variable Topics
    variable Query
    variable TopicsMarkup
    variable ResultsMarkup
    variable Text
    variable TopicItemMarkup
    variable Mobile
    variable State
    variable Action
    variable MessageText
    variable SaveRetry
    variable NewRetry
    variable DeleteRetry
    variable N
    variable P
    variable Config
    variable WaitCount
    variable ReceivedMessage
    variable TopicsAvailable
    variable TopicsListed
    variable TopicsSelected
    variable TopicsDisplayed
    variable TopicsReady
    variable DocletList
    variable CurrentDocletName
    variable SaveAuthToken
    variable DocletViewMode
    variable NewDocletTopic
    variable AutoStartEdit
    variable NewInFlight
    variable NewRequestID
    variable NewTopicButtonLabel
    variable H
    variable DbgTapCount
    variable DbgLastTap
    variable DbgNow
    variable DbgRowVisible

    variable MainScreenWebson

!    debug step

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Set up the UI

!    debug step

!   Set up MQTT
    put `Doclets-` cat random 999999 into MyID
    log `MyID = ` cat MyID
    
    init ServerTopic
        name `a8:41:f4:d3:19:dd/request`
        qos 1

    init MyTopic
        name MyID
        qos 1
    
    get FernetKey from storage as `mqtt-password`
    if FernetKey is `null` clear FernetKey
    if FernetKey is `undefined` clear FernetKey
    if FernetKey is empty
    begin
        put prompt `Enter MQTT password` into FernetKey
        if FernetKey is `null` clear FernetKey
        if FernetKey is `undefined` clear FernetKey
        if FernetKey is not empty
        begin
            put trim FernetKey into FernetKey
            put FernetKey into storage as `mqtt-password`
        end
    end
    if FernetKey is empty go to AbandonShip

    mqtt
        token `rbr` FernetKey
        id MyID
        broker `rbrheating.duckdns.org`
        port 443
        subscribe MyTopic

    on mqtt connect
    begin
        log `MQTT Connected`
        go to Connected
    end
    
    ! Handle incoming messages
    on mqtt message
    begin
        put the mqtt message into ReceivedMessage
    end

    every 20 ticks
    begin
        if tracing stop
        if DocletViewMode is `edit`
        begin
            put DocletEditText into Text
            if Text is MessageText
            begin
                disable DocletViewSave
            end
            else
            begin
                enable DocletViewSave
            end
        end
    end
    stop

Connected:
    ! Do the basic setup of the main window
    put `idle` into State
    put empty into Topics
    put empty into ReceivedMessage
    clear TopicsReady
    set TopicsAvailable to array
    set TopicsSelected to array
	gosub to SetupScreen

    put `topics` into State
    send to ServerTopic
        sender MyTopic
        action `topics`
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Set up the main screen
SetupScreen:
    ! put SaveAuthToken into storage as `save-auth-token`
    log `Set up the screen...`

    set the title to `Doclet reader`

    clear Mobile
    if mobile
    begin
!    	log `Mobile browser detected`
        if portrait
        begin
!        	log `In portrait mode`
        	set Mobile
        end
    end
!    else log `PC browser detected`

	create Body
    if Mobile
    begin
    	set style `width` of Body to `100%`
        set style `overscroll-behavior-y` of Body to `none`
    end
    else
    begin
        put the height of the window into H
        multiply H by 9 giving N
        divide N by 16
    	set style `width` of Body to N cat `px`
        set style `margin` of Body to `0 auto`
        set style `border` of Body to `1px solid lightgray`
    end
    set style `height` of Body to `calc(100vh - 1em)`

!	Render the main screen layout
    rest get MainScreenWebson from `doclets.json?v=` cat now
    	or go to AbandonShip
	render MainScreenWebson in Body

    attach TitleBanner to `rbr-banner`
    attach DebugRow to `easycoder-tracer`
    attach TopicList to `TopicList`
    attach QueryInput to `QueryInput`
    attach TopicsDialogMask to `TopicsDialogMask`
    attach TopicsDialogList to `TopicsDialogList`
    attach TopicItemTemplate to `TopicItemTemplate`
    attach TopicItemTemplateRow to `TopicItem-__SEQ__`
    attach NewDocletDialogMask to `NewDocletDialogMask`
    attach NewDocletDialogList to `NewDocletDialogList`
    attach NewTopicItemTemplate to `NewTopicItemTemplate`
    attach NewTopicButton to `NewTopicButton-__SEQ__`
    attach DocletViewMask to `DocletViewMask`
    attach DocletViewContent to `DocletViewContent`
    attach DocletEditText to `DocletEditTextarea`
    attach DocletListPanel to `DocletListPanel`
    attach ChooseTopicsButton to `ChooseTopicsButton`
    attach SendQueryButton to `SendQueryButton`
    attach NewDocletButton to `NewDocletButton`
    attach TopicsDialogSelectAll to `TopicsDialogSelectAllButton`
    attach TopicsDialogDeselectAll to `TopicsDialogDeselectAllButton`
    attach TopicsDialogOK to `TopicsDialogOKButton`
    attach DocletViewEdit to `DocletViewEditButton`
    attach DocletViewDelete to `DocletViewDeleteButton`
    attach DocletViewSave to `DocletViewSaveButton`
    attach DocletViewClose to `DocletViewCloseButton`
    attach NewDocletCancel to `NewDocletCancelButton`

    on click TitleBanner go to TitleBannerClick
    on click ChooseTopicsButton go to ChooseTopics
    on click SendQueryButton go to SendQueryClick
    on click NewDocletButton go to DocletViewNewClick
    on click TopicsDialogSelectAll go to TopicsDialogSelectAllClick
    on click TopicsDialogDeselectAll go to TopicsDialogDeselectAllClick
    on click TopicsDialogOK go to TopicsDialogOKClick
    on click DocletViewEdit go to DocletViewEditClick
    on click DocletViewDelete go to DocletViewDeleteClick
    on click DocletViewSave go to DocletViewSaveClick
    on click DocletViewClose go to DocletViewCloseClick
    on click NewDocletCancel go to NewDocletCancelClick
    on change DocletEditText go to DocletEditChanged

    enable QueryInput
    remove attribute `disabled` of QueryInput
    disable ChooseTopicsButton
    disable SendQueryButton
    clear SaveRetry
    clear NewRetry
    clear DeleteRetry
    clear AutoStartEdit
    clear NewInFlight
    clear NewRequestID

    set style `display` of DebugRow to `none`
    clear DbgTapCount
    clear DbgLastTap
    clear DbgRowVisible

    get TopicsDisplayed from storage as `topic-list`
    if TopicsDisplayed is `null` clear TopicsDisplayed
    if TopicsDisplayed is `undefined` clear TopicsDisplayed
    gosub to UpdateTopicsLabel
    gosub to UpdateSendButtonState
    split TopicsDisplayed on `,` into Topics
    put 0 into N
    while N is less than the elements of Topics
    begin
        index Topics to N
        if Topics is not empty
        begin
            json add Topics to TopicsSelected
        end
        add 1 to N
    end
    gosub to UpdateTopicsLabel
    log `Topics selected: ` cat TopicsSelected
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! 	Warn the user and abandon this run
AbandonShip:
	alert `An unrecoverable error has occurred.`
    	cat newline cat `Please refresh this browser page to restart.`
    exit

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks the Choose button
ChooseTopics:
    enable QueryInput
    if TopicsAvailable is empty set TopicsListed to array
    else json split TopicsAvailable on `,` into TopicsListed

    ! Build the topic list
    put empty into TopicsMarkup
    put 0 into N
    while N is less than json count of TopicsListed
    begin
        put item N of TopicsListed into Text
        put content of TopicItemTemplate into TopicItemMarkup
        replace `__SEQ__` with N in TopicItemMarkup
        replace `__VALUE__` with Text in TopicItemMarkup
        replace `__TEXT__` with Text in TopicItemMarkup
        put TopicsMarkup
            cat TopicItemMarkup
            into TopicsMarkup
        add 1 to N
    end
    set content of TopicsDialogList to TopicsMarkup

    ! Set the checkboxes
    set the elements of TopicCheckbox to json count of TopicsListed
    put 0 into N
    while N is less than elements of TopicCheckbox
    begin
        index TopicCheckbox to N
        attach TopicCheckbox to `TopicCheckbox-` cat N
        put item N of TopicsListed into Text
        if json index of Text in TopicsSelected is not -1
        begin
            set attribute `checked` of TopicCheckbox
        end
        add 1 to N
    end

    set style `display` of TopicsDialogMask to `flex`
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks a topic checkbox
TopicCheckboxClick:
    put index of TopicCheckbox into N
    put element N of TopicsAvailable into Text
    put json index of Text in TopicsSelected into P
    if P is less than 0
    begin
        json add Text to TopicsSelected
    end
    else
    begin
        json delete element P from TopicsSelected
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks Select All in the Choose dialog
TopicsDialogSelectAllClick:
    put 0 into N
    while N is less than elements of TopicCheckbox
    begin
        index TopicCheckbox to N
        set attribute `checked` of TopicCheckbox
        add 1 to N
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks Deselect All in the Choose dialog
TopicsDialogDeselectAllClick:
    put 0 into N
    while N is less than elements of TopicCheckbox
    begin
        index TopicCheckbox to N
        remove attribute `checked` of TopicCheckbox
        add 1 to N
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks the OK button in the Choose dialog
TopicsDialogOKClick:
    enable QueryInput
    put empty into TopicsDisplayed
    set TopicsSelected to array
    put 0 into N
    while N is less than elements of TopicCheckbox
    begin
        index TopicCheckbox to N
        if TopicCheckbox
        begin
            put item N of TopicsListed into Text
            if TopicsDisplayed is not empty put TopicsDisplayed cat `,` into TopicsDisplayed
            put TopicsDisplayed cat Text into TopicsDisplayed
            json add Text to TopicsSelected
        end
        add 1 to N
    end
    gosub to UpdateTopicsLabel
    set style `display` of TopicsDialogMask to `none`
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks the Send button
SendQueryClick:
    enable QueryInput
    put QueryInput into Query
    put `query` into State
    clear DocletListPanel
    put empty into ReceivedMessage
    log `Send ` cat Query
    send to ServerTopic
        sender MyTopic
        action `query`
        message TopicsDisplayed cat `|` cat Query
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks an item in the results list
ResultsListClick:
    put index of DocletButton into N
    put element N of DocletList into Query
    put the position of `:` in Query into P
    put left P of Query into Query
    put Query into CurrentDocletName
    put `content` into State
    put empty into ReceivedMessage
    send to ServerTopic
        sender MyTopic
        action `view`
        message Query
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Here when the user clicks the exit button
ExitButtonClick:
!    set property `topics` of Config to the text of TopicsLabel
    log Config
!    save Config to ConfigFileName
    exit

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Wait for a reply. This may arrive in a different thread, so just save it
WaitForReply:
    put 0 into WaitCount
    while ReceivedMessage is empty
    begin
        add 1 to WaitCount
        if WaitCount is greater than 100
        begin
            log `Timeout waiting for response`
            enable QueryInput
            remove attribute `disabled` of QueryInput
            if State is `new`
            begin
                clear NewInFlight
                clear NewRequestID
                gosub to ResetNewTopicButtons
                enable NewDocletCancel
            end
            stop
        end
        wait 10 ticks
    end

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Process a received message
ProcessMessage:
    if State is `topics`
    begin
        if Action is `confirm` gosub to SendQueryButtonConfirmation
!        log `Topics available: ` cat ReceivedMessage
        put ReceivedMessage into storage as `topics-available`
        put ReceivedMessage into TopicsAvailable
        set TopicsReady
        gosub to UpdateTopicsLabel
        enable QueryInput
        enable ChooseTopicsButton
        gosub to UpdateSendButtonState
    end
    else if State is `query`
    begin
        enable QueryInput
        if ReceivedMessage is `[]`
        begin
            set content of DocletListPanel to `<div style='font-size:1.3em;font-weight:bold;text-align:center;padding-top:1em;'>No matching doclets</div>`
            stop
        end
        put ReceivedMessage into DocletList
        log DocletList

        put empty into ResultsMarkup
        put 0 into N
        while N is less than json count of DocletList
        begin
            put element N of DocletList into Text
            put the position of `:` in Text into P
            if P is greater than -1
            begin
                put left P of Text into Query
                add 1 to P
                put Query cat `<br>` cat from P of Text into Text
            end
            put ResultsMarkup
                cat `<button id='DocletButton-` cat N cat `' style='display:block;width:100%;text-align:left;margin-bottom:0.3em;'>`
                cat Text
                cat `</button>`
                into ResultsMarkup
            add 1 to N
        end
        set content of DocletListPanel to ResultsMarkup

        set the elements of DocletButton to json count of DocletList
        put 0 into N
        while N is less than elements of DocletButton
        begin
            index DocletButton to N
            attach DocletButton to `DocletButton-` cat N
            add 1 to N
        end
        on click DocletButton go to ResultsListClick
    end
    else if State is `content`
    begin
        enable QueryInput
        put the position of `Error reading file:` in ReceivedMessage into P
        if P is greater than -1
        begin
            alert ReceivedMessage
            stop
        end
        if left 8 of ReceivedMessage is `Created `
        begin
            if CurrentDocletName is not empty
            begin
                put empty into ReceivedMessage
                send to ServerTopic
                    sender MyTopic
                    action `view`
                    message CurrentDocletName
                go to WaitForReply
            end
            stop
        end
        put ReceivedMessage into MessageText
        put `view` into DocletViewMode
        set style `display` of DocletEditText to `none`
        set style `display` of DocletViewContent to `block`
        set attribute `data-markdown` of DocletViewContent to `1`
        set content of DocletViewContent to MessageText
        scroll DocletViewContent to 0
        set content of DocletViewEdit to `Edit`
        enable DocletViewEdit
        enable DocletViewDelete
        set style `display` of DocletViewDelete to `block`
        disable DocletViewSave
        set style `display` of DocletViewSave to `none`
        set style `display` of DocletViewMask to `flex`
        if AutoStartEdit
        begin
            clear AutoStartEdit
            gosub to DocletViewEditClick
        end
    end
    else if State is `new`
    begin
        clear NewInFlight
        gosub to ResetNewTopicButtons
        enable NewDocletCancel
        enable QueryInput
        put ReceivedMessage into MessageText
        if left 8 of MessageText is `Created `
        begin
            if SaveAuthToken is not empty
            begin
                put SaveAuthToken into storage as `save-auth-token`
            end
            clear NewRequestID
            put MessageText into CurrentDocletName
            replace `Created ` with empty in CurrentDocletName
            set style `display` of NewDocletDialogMask to `none`
            set style `display` of TopicsDialogMask to `none`
            set style `display` of DocletViewMask to `none`
            set AutoStartEdit
            put `content` into State
            put empty into ReceivedMessage
            send to ServerTopic
                sender MyTopic
                action `view`
                message CurrentDocletName
            go to WaitForReply
        end
        else
        begin
            put the position of `unauthorized` in MessageText into P
            if P is greater than -1
            begin
                clear SaveAuthToken
                remove `save-auth-token` from storage
                if NewRetry is 0
                begin
                    put 1 into NewRetry
                    gosub to EnsureSaveAuthToken
                    if SaveAuthToken is empty
                    begin
                        alert `Create denied and no new token entered; create cancelled`
                        stop
                    end
                    put empty into ReceivedMessage
                    send to ServerTopic
                        sender MyTopic
                        action `new`
                        message SaveAuthToken cat newline cat NewDocletTopic cat newline cat NewRequestID
                    go to WaitForReply
                end
            end
            clear NewRequestID
            alert MessageText
        end
    end
    else if State is `save`
    begin
        enable QueryInput
        put ReceivedMessage into MessageText
        put the position of `Saved ` in MessageText into P
        if P is greater than -1
        begin
            if SaveAuthToken is not empty
            begin
                put SaveAuthToken into storage as `save-auth-token`
            end
            ! Refresh the current result set so list entries reflect saved changes
            alert MessageText
            go to SendQueryClick
        end
        put the position of `unauthorized` in MessageText into P
        if P is greater than -1
        begin
            clear SaveAuthToken
            remove `save-auth-token` from storage
            if SaveRetry is 0
            begin
                put 1 into SaveRetry
                gosub to EnsureSaveAuthToken
                if SaveAuthToken is empty
                begin
                    disable DocletViewSave
                    enable DocletViewEdit
                    alert `Save denied and no new token entered; save cancelled`
                    stop
                end
                put DocletEditText into MessageText
                put empty into ReceivedMessage
                send to ServerTopic
                    sender MyTopic
                    action `save`
                    message SaveAuthToken cat newline cat CurrentDocletName cat newline cat MessageText
                go to WaitForReply
            end
        end
        disable DocletViewSave
        enable DocletViewEdit
        alert MessageText
    end
    else if State is `delete`
    begin
        enable QueryInput
        put ReceivedMessage into MessageText
        put the position of `Deleted ` in MessageText into P
        if P is greater than -1
        begin
            if SaveAuthToken is not empty
            begin
                put SaveAuthToken into storage as `save-auth-token`
            end
            alert MessageText
            gosub to CloseDocletView
            go to SendQueryClick
        end

        put the position of `unauthorized` in MessageText into P
        if P is greater than -1
        begin
            clear SaveAuthToken
            remove `save-auth-token` from storage
            if DeleteRetry is 0
            begin
                put 1 into DeleteRetry
                gosub to EnsureSaveAuthToken
                if SaveAuthToken is empty
                begin
                    alert `Delete denied and no new token entered; delete cancelled`
                    stop
                end
                put empty into ReceivedMessage
                send to ServerTopic
                    sender MyTopic
                    action `delete`
                    message SaveAuthToken cat newline cat CurrentDocletName
                go to WaitForReply
            end
        end
        alert MessageText
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Switch the doclet view into edit mode
DocletViewEditClick:
    if DocletViewMode is `view`
    begin
        put `edit` into DocletViewMode
        set content of DocletViewEdit to `View`
        set style `display` of DocletViewContent to `none`
        set style `display` of DocletEditText to `block`
        set content of DocletEditText to MessageText
        set style `display` of DocletViewDelete to `none`
        disable DocletViewDelete
        set style `display` of DocletViewSave to `block`
        disable DocletViewSave
    end
    else
    begin
        put `view` into DocletViewMode
        set content of DocletViewEdit to `Edit`
        put DocletEditText into MessageText
        set style `display` of DocletEditText to `none`
        set style `display` of DocletViewContent to `block`
        set attribute `data-markdown` of DocletViewContent to `1`
        set content of DocletViewContent to MessageText
        set style `display` of DocletViewDelete to `block`
        enable DocletViewDelete
        set style `display` of DocletViewSave to `none`
        disable DocletViewSave
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Enable Save only when edit content differs from baseline MessageText
DocletEditChanged:
    if DocletViewMode is `edit`
    begin
        put DocletEditText into Text
        if Text is MessageText
        begin
            disable DocletViewSave
        end
        else
        begin
            enable DocletViewSave
        end
    end
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Open the New doclet topic picker dialog
DocletViewNewClick:
    gosub to EnsureSaveAuthToken
    if SaveAuthToken is empty
    begin
        alert `No authorization token entered; create cancelled`
        stop
    end

    if TopicsSelected is empty
    begin
        alert `No topics are selected`
        stop
    end

    clear NewInFlight
    clear NewRequestID
    enable NewDocletCancel

    put empty into TopicsMarkup
    put 0 into N
    while N is less than json count of TopicsSelected
    begin
        put element N of TopicsSelected into Text
        put content of NewTopicItemTemplate into TopicItemMarkup
        replace `__SEQ__` with N in TopicItemMarkup
        replace `__VALUE__` with Text in TopicItemMarkup
        replace `__TEXT__` with Text in TopicItemMarkup
        put TopicsMarkup cat TopicItemMarkup into TopicsMarkup
        add 1 to N
    end
    set content of NewDocletDialogList to TopicsMarkup

    set the elements of NewTopicButton to json count of TopicsSelected
    put 0 into N
    while N is less than elements of NewTopicButton
    begin
        index NewTopicButton to N
        attach NewTopicButton to `NewTopicButton-` cat N
        put element N of TopicsSelected into NewTopicButtonLabel
        set text of NewTopicButton to NewTopicButtonLabel
        enable NewTopicButton
        set style `opacity` of NewTopicButton to `1`
        add 1 to N
    end
    on click NewTopicButton go to NewTopicButtonClick

    set style `display` of NewDocletDialogMask to `flex`
    stop

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Create immediately when a topic button is tapped
NewTopicButtonClick:
    if NewInFlight stop
    put index of NewTopicButton into N
    put element N of TopicsSelected into NewDocletTopic
    put 0 into P
    while P is less than elements of NewTopicButton
    begin
        index NewTopicButton to P
        disable NewTopicButton
        if P is N
        begin
            set text of NewTopicButton to `Creating...`
            set style `opacity` of NewTopicButton to `1`
        end
        else
        begin
            set style `opacity` of NewTopicButton to `0.65`
        end
        add 1 to P
    end
    disable NewDocletCancel
    go to NewDocletCreateClick

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Cancel New doclet creation
NewDocletCancelClick:
    clear NewInFlight
    clear NewRequestID
    gosub to ResetNewTopicButtons
    enable NewDocletCancel
    set style `display` of NewDocletDialogMask to `none`
    stop

ResetNewTopicButtons:
    put 0 into P
    while P is less than elements of NewTopicButton
    begin
        index NewTopicButton to P
        put element P of TopicsSelected into NewTopicButtonLabel
        set text of NewTopicButton to NewTopicButtonLabel
        enable NewTopicButton
        set style `opacity` of NewTopicButton to `1`
        add 1 to P
    end
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Create a New doclet in the selected topic
NewDocletCreateClick:
    if NewInFlight stop
    if NewDocletTopic is empty
    begin
        if json count of TopicsSelected is 0
        begin
            alert `No topics are selected`
            stop
        end
        put element 0 of TopicsSelected into NewDocletTopic
    end
    put `new-` cat random 999999999 into NewRequestID
    set NewInFlight
    disable NewDocletCancel
    put 0 into NewRetry
    put `new` into State
    put empty into ReceivedMessage
    send to ServerTopic
        sender MyTopic
        action `new`
        message SaveAuthToken cat newline cat NewDocletTopic cat newline cat NewRequestID
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Save edited doclet content
DocletViewSaveClick:
    gosub to EnsureSaveAuthToken
    if SaveAuthToken is empty
    begin
        alert `No authorization token entered; save cancelled`
        stop
    end
    put DocletEditText into MessageText
    put `save` into State
    put empty into ReceivedMessage
    send to ServerTopic
        sender MyTopic
        action `save`
        message SaveAuthToken cat newline cat CurrentDocletName cat newline cat MessageText
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Delete current doclet from prettified view
DocletViewDeleteClick:
    put confirm `Delete ` cat CurrentDocletName cat ` ?` into Text
    if Text is empty stop

    gosub to EnsureSaveAuthToken
    if SaveAuthToken is empty
    begin
        alert `No authorization token entered; delete cancelled`
        stop
    end

    put 0 into DeleteRetry
    put `delete` into State
    put empty into ReceivedMessage
    send to ServerTopic
        sender MyTopic
        action `delete`
        message SaveAuthToken cat newline cat CurrentDocletName
    go to WaitForReply

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Close the doclet view popup
DocletViewCloseClick:
    gosub to CloseDocletView
    stop

CloseDocletView:
    enable QueryInput
    put `view` into DocletViewMode
    set content of DocletViewEdit to `Edit`
    disable DocletViewEdit
    disable DocletViewDelete
    set style `display` of DocletViewDelete to `block`
    disable DocletViewSave
    set style `display` of DocletViewSave to `none`
    set style `display` of DocletEditText to `none`
    set style `display` of DocletViewContent to `block`
    set style `display` of DocletViewMask to `none`
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Set the text of the topics label
UpdateTopicsLabel:
    if TopicsDisplayed is `null` clear TopicsDisplayed
    if TopicsDisplayed is `undefined` clear TopicsDisplayed
    if TopicsDisplayed is empty
    begin
        set content of TopicList to `No topics chosen`
        set style `color` of TopicList to `#800`
    end
    else
    begin
        if TopicsReady
        begin
            if json count of TopicsSelected is json count of TopicsAvailable
            begin
                set content of TopicList to `All topics chosen`
                set style `color` of TopicList to `#080`
            end
            else
            begin
                set content of TopicList to `Topics: ` cat TopicsDisplayed
                set style `color` of TopicList to `inherit`
            end
        end
        else
        begin
            set content of TopicList to `Topics: ` cat TopicsDisplayed
            set style `color` of TopicList to `inherit`
        end
    end
    put TopicsDisplayed into storage as `topic-list`
    gosub to UpdateSendButtonState
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Enable Send only when topics have loaded and at least one topic is chosen
UpdateSendButtonState:
    if TopicsReady
    begin
        if TopicsDisplayed is empty disable SendQueryButton
        else enable SendQueryButton
    end
    else
    begin
        disable SendQueryButton
    end
    return

! Send a confirmation message
SendConfirmation:
    send to ServerTopic
        sender MyTopic
        action `confirm`
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Triple-tap title to show/hide the tracer panel
TitleBannerClick:
    put now into DbgNow
    ! Handle both second-based and millisecond-based now values
    if DbgNow is greater than 10000000000 put 3000 into P
    else put 3 into P

    if DbgLastTap is empty
    begin
        put 1 into DbgTapCount
    end
    else
    begin
        put DbgNow into N
        take DbgLastTap from N
        if N is greater than P put 1 into DbgTapCount
        else add 1 to DbgTapCount
    end

    put DbgNow into DbgLastTap
    if DbgTapCount is greater than 2
    begin
        clear DbgTapCount
        gosub to ToggleDebugRow
    end
    stop

ToggleDebugRow:
    if DbgRowVisible
    begin
        clear DbgRowVisible
        clear DebugRow
        set style `display` of DebugRow to `none`
    end
    else
    begin
        set DbgRowVisible
        set style `display` of DebugRow to `block`
    end
    return

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!   Ensure we have a save auth token (stored locally, prompt only if missing)
EnsureSaveAuthToken:
    get SaveAuthToken from storage as `save-auth-token`
    if SaveAuthToken is `null` clear SaveAuthToken
    if SaveAuthToken is `undefined` clear SaveAuthToken
    if SaveAuthToken is empty
    begin
        put prompt `Enter save authorization token` into SaveAuthToken
        if SaveAuthToken is `null` clear SaveAuthToken
        if SaveAuthToken is `undefined` clear SaveAuthToken
        if SaveAuthToken is not empty
        begin
            put trim SaveAuthToken into SaveAuthToken
        end
    end
    return
