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

var formatResponse = (responseList, options) => {
  let idsArray = [];
  let closedCount = 0;
  let openElements = [];
  let pageNumber = options["page"] || 0
  const primaryColors = ["red", "blue", "yellow"];

  let invalidColorFlag = determineInvalidColor(options["colors"]);
  console.log("flag ", invalidColorFlag );
  let pageResults = determinePages(options, invalidColorFlag);

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


var determineInvalidColor = (colorOptions) => {
  console.log("colorOptions: ", colorOptions);
  const colorList = ["red", "brown", "blue", "yellow", "green"];
  let invalidFlag = false;

  // if colorOptions is "undefined"
  if (!colorOptions) {
    invalidFlag = false;
    return invalidFlag
  } else {
    colorOptions.forEach((element) => {
      console.log(element);
      if(colorList.includes(element) == false) {
        invalidFlag = true;
        return invalidFlag
      }
    })
  }

  return invalidFlag;

};

var determinePages = (options, flag) => {
  let page = options["page"] || 0;
  let pageObject = {
    previous: null,
    next: null
  }

  if (flag) {
    pageObject["previous"] = null;
    pageObject["next"] = null;
  } else if (page < 2) {
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

var buildQueryString = (options, url) => {

  let colors = options["colors"] ? options["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let page = options["page"] ? (options["page"] * 10) - 10 : 0;


  let queryString = URI(url)
    .addSearch("limit", 10)
    .addSearch("offset", page)
    .addSearch("color[]", colors)

  return queryString
};

export default retrieve;
