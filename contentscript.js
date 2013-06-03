(function(document) {

  // globals
  
  var TITLES_COUNT = 0
  
  var POTATO_SERVER = 'http://localhost:3000'

  /**
   * Helper function to check if callback is function
   *
   * @method isFunction
   * @param {String} functionToCheck Function name
   */   
  function isFunction(functionToCheck) {
    var getType = {}
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]'
  }
  
  /**
   * Performs an XMLHttpRequest to Potato's API.
   *
   * @method sendPotato
   * @param {String} verb HTTP defined method
   * @param {String} url Potato's server URL
   * @param {Object} config A config object
   * @param {String} config.__class__ The class name of the thing. See: http://schema.org/Thing
   * @param {Function} callback A callback function
   */
  function sendPotato(verb, url, conf, callback) {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function(data) {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
	      callback(
            JSON.parse(xhr.responseText)
	      )
	    }
        else {
	      callback(null)
        }
      }
    }
    xhr.open(verb, url + '/' + conf.__class__, true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.send(JSON.stringify(conf))
  }

  /**
   * Find Netflix titles
   *
   * @method findNetflixTitles
   */
  function findNetflixTitles() {
    var titles, titlesLength
    if (document.querySelector('#page-WiGenre')) {
      titles = document.querySelectorAll('.agMovie img')
      titlesLength = titles.length      
      if (titlesLength > TITLES_COUNT) {
        for (TITLES_COUNT; TITLES_COUNT < titlesLength; TITLES_COUNT++) {
          sendPotato(
            'POST',
            POTATO_SERVER,              
            {
              __class__: 'TVSeries', // http://schema.org/TVSeries
              provider: 'netflix',
              name: titles[TITLES_COUNT].alt,  
              thumbnailUrl: titles[TITLES_COUNT].src
            }, function(response) {
              if (!response) {
                console.log('Unable to save')
                return
              }
              console.log(response)
            }
          )
        }
      }
    }
  }

  /**
   * Find Hulu titles
   *
   * @method findHuluTitles
   */
  function findHuluTitles() {
    var titles, thumbnail, name, titlesLength
    titles = document.querySelectorAll('.browse .item')
    titlesLength = titles.length    
    if (titlesLength > TITLES_COUNT) {
      for (TITLES_COUNT; TITLES_COUNT < titlesLength; TITLES_COUNT++) {
        name = titles[TITLES_COUNT].querySelector('div.description .title')
        thumbnail = titles[TITLES_COUNT].querySelector('img.thumbnail')
        sendPotato(
          'POST',
          POTATO_SERVER,
          {
            __class__: 'TVSeries', // http://schema.org/TVSeries
            provider: 'hulu',
            name: name.innerText,  
            thumbnailUrl: thumbnail.src
          }, function(response) {
            if (!response) {
              console.log('Unable to save')
              return
            }
            console.log(response)
          }
        )
      }
    }
  }

  /**
   * Init
   */
  function init() {
  
    var providers, provider, observer
    
    // get a list of all video stream providers
    providers = providersList()
    
    // shortcut
    provider = providers[window.location.hostname]    

    // if hostname is not listed as provider, there is nothing to do
    if (!provider) return
    
    // halt if provider does not register a callback
    if (!isFunction(provider.callback)) return

    // first run; find all the listed titles    
    provider.callback()

    // observe mutations?
    if (!provider.observe) return
    
    // create a new mutation observer and set callback
    observer = new MutationObserver(
      provider.callback
    )

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document, {
      subtree: true,
      attributes: true
    })
    
  }
  
  /**
   * List of video providers
   */
  function providersList() {
    return {
      'movies.netflix.com' : {
        callback : findNetflixTitles,
        observe: true
      },
      'www.hulu.com' : {  
        callback : findHuluTitles,
        observe: true
      }
    }
  }
  
  /**
   * Fire init when DOM state is complete
   */
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      init() 
      clearInterval(readyStateCheckInterval)
    }
  }, 10) 

})(document)