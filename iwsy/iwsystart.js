window.onload = () => {
    const createCORSRequest = (url) => {
        let xhr = new XMLHttpRequest();
        if (`withCredentials` in xhr) {
    
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(`GET`, url, true);
    
        } else if (typeof XDomainRequest != `undefined`) {
    
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(`GET`, url);
    
        } else {
    
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
    
        }
        return xhr;
    };

    const scriptElement = document.getElementById(`iwsy-script`);
    if (scriptElement) {
        const request = createCORSRequest(`${scriptElement.innerText}?v=${Math.floor(Date.now())}`);
        if (!request) {
            throw Error(`Unable to access the JSON script`);
        }

        request.onload = () => {
            if (200 <= request.status && request.status < 400) {
                const script = JSON.parse(request.responseText);
                IWSY(document.getElementById(`iwsy-container`), script);
        } else {
                throw Error(`Unable to access the JSON script`);
            }
        };

        request.onerror = () => {
            throw Error(`Unable to access the JSON script`);
        };

        request.send();
    }
};

// Wait for a click/tap or a keypress to start
document.addEventListener(`click`, init);
document.onkeydown = function (event) {
    if (event.code === `Enter`) {
        mode = `auto`;
    }
    setup();
    return true;
};