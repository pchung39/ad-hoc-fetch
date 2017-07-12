import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

/*
MAIN FUNCTION: takes in an "options" dictionary which can either have a page number
a color or both. The fetch response is manipulated into the desired object format and returned.
*/
var retrieve = (options = {}) => {

  let queryString = buildQueryString(options, path).toString();

  return fetch(queryString)
    .then(response => {
      let json = response.json();
      if (response.ok) {
        return json;
      } else {
        return json.then(Promise.reject.bind(Promise));
      }
    })
    .then(response => returnRecords(response, options))
    .catch(e => console.log("error: ", e))


};

/*
Builds a query string using the "localhost" path and the "options" argument.
Additional validation is used in the cases where a page or colors are not provided in the "options" object.
*/
var buildQueryString = (options, url) => {

  let colors = options["colors"] ? options["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let offset = options["page"] ? (options["page"] * 10) - 10 : 0;

  let queryString = URI(url)
    .addSearch("limit", 10)
    .addSearch("offset", offset)
    .addSearch("color[]", colors);

  return queryString;
};

/*
Once the "/records" fetch completes, the returned reponse is formatted as per the instructions.
In order to provide a previous and next page, two additional fetches need to be made to check whether there
is additional data immediately before and after the initial fetch request. This process is encapsulated by the
`getPageAssets` function called inside the `returnRecords` function.
*/
var returnRecords = (responseList, options) => {

  return getPageAssets(responseList, options)
  .then(response => formatRecords(response, responseList, options))
  .catch(e => console.log("error: ", e))

}

/*
This function does the work of manipulating the fetch call reponse into an appropriate form as described in the Requirements.
We cycle through each entry in the response and create a new object and return it. After the cycle is complete, the newly
formated object is returned.

Object format : {previousPage: int, nextPage: int, ids: list, open: list, closedPrimaryCount: int}
*/
var formatRecords = (pageResults, responseList, options) => {

  let idsArray = [];
  let closedCount = 0;
  let openElements = [];
  let pageNumber = options["page"] || 0;
  const primaryColors = ["red", "blue", "yellow"];

  responseList.forEach((element) => {

    idsArray.push(element["id"]);

    if (element["disposition"] == "open") {

      element["isPrimary"] = primaryColors.includes(element["color"]);
      openElements.push(element);

    } else if (element["disposition"] == "closed") {

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

  return recordObject;


}


/*
Executes fetches for previous and next pages and returns a page object.
*/
var getPageAssets = (responseList, options) => {

  let colors = options["colors"]
  let currentPage = options["page"] ? options["page"]: 1;
  let previousPageCall;
  let nextPageCall;
  let pageObject = {
    previous: null,
    next: null
  };

  if (currentPage == 1) {

    previousPageCall = null;

  } else {

    previousPageCall = fetchNextAndPreviousPages(path,{ page: currentPage - 1, colors: colors })
      .then(response => pageObject["previous"] = response.length > 0 ? currentPage - 1 : null )
      .catch(e => console.log("error: ", e))
  }

  if (responseList.length < 10) {

    nextPageCall = null

  } else {

    nextPageCall = fetchNextAndPreviousPages(path, { page: currentPage + 1, colors: colors })
      .then(response => pageObject["next"] = response.length > 0 ? currentPage + 1 : null )
      .catch(e => console.log("error: ", e))
  }

  return Promise.all([previousPageCall, nextPageCall])
    .then(response => pageObject)
    .catch(e => console.log("error: ", e))

};

/*
A new query string is built for the 10 entries immediately before and after
the initial fetch request. Returns the fetch call response.
*/
var fetchNextAndPreviousPages = (path, options={}) => {

  let queryString = buildQueryString(options, path).toString();

  return fetch(queryString)
    .then(response => response.json())
    .then(response => response)
    .catch(error => console.log("error: ", error))

}

export default retrieve;
