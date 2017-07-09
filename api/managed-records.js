import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";


var retrieve = (options = {}) => {

  let queryString = buildQueryString(options, path).toString();
  console.log(queryString);

  return fetch(queryString)
    .then(res => res.json())
    .then(res => formatResponse(res, options))
    .catch(e => console.log("error", e));

};
/*
var createOffset = (page) => {

  if (page > 0) {
    let offset = (page * 10) - 9;
  } else {
    let offset = 0
  };

  return offset;

};
*/

var formatResponse = (responseList, options) => {
  let idsArray = [];
  let closedCount = 0;
  let openElements = [];
  let pageNumber = options["page"] || 0
  // activate foreach loop
  let primaryColors = ["red", "blue", "yellow"];
  console.log(pageNumber);


  // calculuate previousPage


  let pageResults = determinePages(options);
  //console.log(pageResults)
  /*
  else {
    if (pageNumber < 2) {
      let previous = null;
      let next = 2;
    } else if (pageNumber > 50) {
      let previous = pageNumber - 1;
      let next = null;
    } else {
      let previous = pageNumber - 1;
      let next = pageNumber + 1;
    }
  }
  */


  responseList.forEach((element) => {
    // push to ids Array
    idsArray.push(element["id"]);

    // if open push whole element to openElements list
    if (element["disposition"] == "open") {
      //determine if color is primary color
      let primaryColorEvaluation = primaryColors.includes(element["color"]) ? true : false;

      //add evaluation to element object
      element["isPrimary"] = primaryColorEvaluation;
      openElements.push(element);
    }
    // determine if primary color and closed

    if (element["disposition"] == "closed") {
      if (primaryColors.includes(element["color"]) == true) {
          closedCount++;
        }
      };
    });

  let recordObject = {
    previousPage : pageResults["previous"],
    nextPage: pageResults["next"],
    ids : idsArray,
    open : openElements,
    closedPrimaryCount: closedCount
  };
  // return response object
  console.log(recordObject);
  return recordObject

}

var determinePages = (options) => {
  let page = options["page"] || 0;
  let pageObject = {
    previous: null,
    next: null
  }

  if (page < 2) {
    pageObject["previous"] = null;
    pageObject["next"] = 2;
  } else if (page >= 50) {
    pageObject["previous"] = page - 1;
    pageObject["next"] = null;
  } else {
    pageObject["previous"] = page - 1;
    pageObject["next"] = page + 1;
  }

  return pageObject

};

var buildQueryString = (parameters, url) => {
  // use format to shorten code URI()

  let colors = parameters["colors"] ? parameters["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let page = parameters["page"] ? (parameters["page"] * 10) - 10 : 0;


  //let offset = createOffset(page);
  //let colorString = createColorString(colors);

  let queryString = URI(url)
    .addSearch("limit", 10)
    .addSearch("offset", page)
    .addSearch("color[]", colors)

  return queryString
};

export default retrieve;
