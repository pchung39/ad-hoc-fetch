import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";


var retrieve = (options = {}) => {

  let queryString = buildQueryString(options, path).toString();

  return fetch(queryString)
    .then(response => {
      let json = response.json();
      if (response.ok == true) {
        return json
      } else {
        return json.then(Promise.reject.bind(Promise));
      }
    })
    .then(response => formatResponse(response, options, queryString))
    .catch(e => console.log(e))


};

var buildQueryString = (options, url) => {

  let colors = options["colors"] ? options["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let page = options["page"] ? (options["page"] * 10) - 10 : 0;

  let queryString = URI(url)
    .addSearch("limit", 10)
    .addSearch("offset", page)
    .addSearch("color[]", colors)

  return queryString
};

var formatResponse = (responseList, options, queryString) => {
  let idsArray = [];
  let closedCount = 0;
  let openElements = [];
  let pageNumber = options["page"] || 0;
  const primaryColors = ["red", "blue", "yellow"];

  return getPageAssets(queryString)
  .then(response => {
    // will need to turn this into separate function and use .then from page results
    responseList.forEach((element) => {

      idsArray.push(element["id"]);
      if (element["disposition"] == "open") {

        let primaryColorEvaluation = primaryColors.includes(element["color"]) ? true : false;
        element["isPrimary"] = primaryColorEvaluation;
        openElements.push(element);

      }

      if (element["disposition"] == "closed") {
        if (primaryColors.includes(element["color"]) == true) {
            closedCount++;
          }
        };

      });

    let recordObject = {
      previousPage : response["previous"],
      nextPage: response["next"],
      ids : idsArray,
      open : openElements,
      closedPrimaryCount: closedCount
    };

    return recordObject
  }

  );


  // return response object
  //console.log(recordObject);
  return recordObject

}

var fetchNextAndPreviousPages = (path, options={}) => {

  let colors = options["colors"] ? options["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let queryString = buildQueryString(options, path).toString();

  return fetch(queryString)
    .then(response => response.json())
    .then(response => {return response})
    .catch(error => console.log(error))

}

var getPageAssets = (url) => {
  let uri = URI(url);
  let urlparameters = URI.parseQuery(uri.query());
  let offset = parseInt(urlparameters["offset"]);
  let colors = urlparameters["color[]"];
  let pageObject = {
    previous: null,
    next: null
  };

  let previousPage = (offset) / 10;
  let nextPage = (offset + 20) / 10;

  if (offset == 0) {
    let nextPageCall = fetchNextAndPreviousPages(path,{ page: nextPage, colors: colors })
      .then(response => { pageObject["next"] = response.length > 0 ? nextPage : null })

    let previousPageCall = null;

    return Promise.all([nextPageCall, previousPageCall])
      .then(response => {return pageObject})

  } else {
    let previousPageCall = fetchNextAndPreviousPages(path,{ page: previousPage, colors: colors })
      .then(response => { pageObject["previous"] = response.length > 0 ? previousPage : null })

    let nextPageCall = fetchNextAndPreviousPages(path, { page: nextPage, colors: colors })
      .then(response => { pageObject["next"] = response.length > 0 ? nextPage : null })

    return Promise.all([nextPageCall, previousPageCall])
      .then(response => {return pageObject})
  }

};

export default retrieve;
