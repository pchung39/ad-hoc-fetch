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
        return json
      } else {
        return json.then(Promise.reject.bind(Promise));
      }
    })
    .then(response => returnRecords(response, options, queryString))
    .catch(e => console.log("error: ", e))


};

/*
Builds a query string using the "localhost" path and the "options" argument.
Additional validation is used in the cases where a page or colors are not provided in the "options" object.
*/
var buildQueryString = (options, url) => {

  let colors = options["colors"] ? options["colors"] : ["red", "brown", "blue", "yellow", "green"];
  let page = options["page"] ? (options["page"] * 10) - 10 : 0;

  let queryString = URI(url)
    .addSearch("limit", 10)
    .addSearch("offset", page)
    .addSearch("color[]", colors)

  return queryString
};

/*
Once the "/records" api completes, the returned reponse is formatted as per the instructions.
In order to provide a previous and next page, two additional fetches need to be made to check whether there
is additional data immediately before and after the initial request. This process is encapsulated by the
`getPageAssets` function called inside this function.
*/
var returnRecords = (responseList, options, queryString) => {

  return getPageAssets(responseList, options)
  .then(response => formatRecords(response, responseList, options))
  .catch(e => console.log("error: ", e))

}

/*
This function does the extensive work of manipulating the fetch call reponse into an appropriate form that
satisfies the unit test test cases. We cycle through each entry in the response and create a new object and return it.

Object format : {previousPage: int, nextPage: int, ids: list, open: list, closedPrimaryCount: int}

1. Add all `ids` to returned object
2. If the color of the entry is a primary color (red, blue, yellow) append a "isPrimary" (boolean) to the entry.
3. If the entry disposition is "open" add it to the "open" list.
4. If the entry disposition is "closed" and the entry color is primary increment the "closedCount" by 1.

After the cycle is complete, each constituent part is added to a recordObject and returned.
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

  return recordObject


}


/*
In order to calculate whether there is a previous and next page, a simple call is made for the 10 entries
immediately before and after the initial fetch request. The results will always be 1 of 2 outcomes, either the
fetch response will be an empty list or a populated list. With this information we can make an informed
decision on what the previous and next page numbers will be.
*/
var getPageAssets = (responseList, options) => {

  let previousPageCall;
  let nextPageCall;
  let pageObject = {
    previous: null,
    next: null
  };
  let colors = options["colors"]
  let currentPage = options["page"] ? options["page"]: 1;

  if (currentPage == 1) {

    previousPageCall = null;

  } else {

    previousPageCall = fetchNextAndPreviousPages(path,{ page: currentPage - 1, colors: colors })
      .then(response => { pageObject["previous"] = response.length > 0 ? currentPage - 1 : null })
      .catch(e => console.log("error: ", e))
  }

  if (responseList.length < 10) {

    nextPageCall = null

  } else {

    nextPageCall = fetchNextAndPreviousPages(path, { page: currentPage + 1, colors: colors })
      .then(response => { pageObject["next"] = response.length > 0 ? currentPage + 1 : null })
      .catch(e => console.log("error: ", e))
  }


  return Promise.all([previousPageCall, nextPageCall])
    .then(response => {return pageObject})
    .catch(e => console.log("error: ", e))

};

/*
Simple fetch call to build a new query string for the 10 entries immediately before and after
the initial fetch request. Returns the fetch call response.
*/
var fetchNextAndPreviousPages = (path, options={}) => {

  let queryString = buildQueryString(options, path).toString();

  return fetch(queryString)
    .then(response => response.json())
    .then(response => {return response})
    .catch(error => console.log("error: ", error))

}

export default retrieve;
