const axios = require("axios");
const cron = require("node-cron");
// Replace with your actual Zoho Analytics and Zoho Creator details
const orgId = "60015091101";
const workspaceId = "243549000000036425";
const viewId = "243549000001864122";
const fs = require("fs");

const zohoClientId = "1000.ZW53NLBZ0Y1A3DG0LGWF0NU3N2ZTPI";
const zohoClientSecret = "e80a1e3106a5e9e079908efebf32625c0185900ae1";
const zohoRefreshToken =
  "1000.b5ecc407637fc30c4bf4c0787a28ca4b.9a50b3b5535946bf3bf7cb7cade7f2ee";

async function getZohoAccessToken() {
  const url = "https://accounts.zoho.in/oauth/v2/token";
  const data = {
    grant_type: "refresh_token",
    client_id: zohoClientId,
    client_secret: zohoClientSecret,
    refresh_token: zohoRefreshToken,
  };

  const headers = { "Content-Type": "application/x-www-form-urlencoded" };

  try {
    const response = await axios.post(
      url,
      new URLSearchParams(data).toString(),
      { headers }
    );
    return response.data.access_token;
  } catch (error) {}
}

async function getJobid(accessToken) {
  const encodedConfig = encodeURIComponent(
    JSON.stringify({
      responseFormat: "json",
    })
  );

  const apiUrl = `https://analyticsapi.zoho.in/restapi/v2/bulk/workspaces/${workspaceId}/views/${viewId}/data?CONFIG=${encodedConfig}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "ZANALYTICS-ORGID": orgId,
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    console.log("jobId", response.data.data.jobId);
    // process.exit(0);
    return response?.data?.data?.jobId; // Returns the fetched data array
  } catch (error) {
    console.log(error);
  }
}

async function fetchDataFromZohoAnalytics(accessToken, jobiddata) {
  const encodedConfig = encodeURIComponent(
    JSON.stringify({
      responseFormat: "json",
    })
  );

  console.log("jobiddata in last moment", jobiddata);

  const apiUrl = `https://analyticsapi.zoho.in/restapi/v2/bulk/workspaces/${workspaceId}/exportjobs/${jobiddata}/data?CONFIG=${encodedConfig}`;

  console.log("apiUrl", apiUrl);

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "ZANALYTICS-ORGID": orgId,
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    // console.log(response.data);
    return response.data.data; // Returns the fetched data array
  } catch (error) {
    console.log(error);
  }
}

function groupDataByProductId(data) {
  const groupedData = {};

  data.forEach((entry) => {
    const productId = entry["ProductID"];
    const itemName = entry["Item Name"];

    if (!groupedData[productId]) {
      groupedData[productId] = { itemName, batchDetails: [] };
    }

    groupedData[productId].batchDetails.push({
      Batch_ID: entry["Batch In ID"],
      Batch_No: entry["Batch Number"],
      Bill_No: entry["Batch Reference#"],
      Available_Quantity: Number(entry["Balance Quantity"]),
      Bill_ID: entry["Bill ID"],
      Garden: entry["Garden"],
      Grade: entry["Grade"],
      Qty_per_Bag: entry["Qty Per Bag"],
      Sale_Broker_Lot: entry["Sale/Broker/Lot"],
      W_h: entry["W/h"],
    });
  });

  return groupedData;
}

async function sendDataToZohoCreator(batchedData, accessToken) {
  const apiUrl =
    "https://creator.zoho.in/api/v2/upsourcedconsultancyservices/tea-blending/form/Product"; // Replace with your actual Zoho Creator API URL
  const delayBetweenRequests = 20 * 1000;
  try {
    for (let i = 0; i < batchedData.length; i += 5) {
      const currentBatches = batchedData.slice(i, i + 5);
      const promises = currentBatches.map((batch, index) => {
        return (async (batchIndex) => {
          try {
            const response = await axios.post(
              apiUrl,
              {
                data: batch,
              },
              {
                headers: {
                  Authorization: `Zoho-oauthtoken ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            // Log success message
            console.log(`Batch ${i + batchIndex + 1} processed successfully.`);
            return response.data; // Return data if needed
          } catch (error) {
            console.error(
              `Error processing batch ${i + batchIndex + 1}:`,
              error.message
            );
            console.error(error);
            throw error; // Throw error to stop processing further batches
          }
        })(index);
      });

      // Execute the current set of promises
      await Promise.all(promises);

      console.log(
        `Set of 5 batches from ${i + 1} to ${i + 5} processed successfully.`
      );

      // Introduce a delay before processing the next set of batches
      if (i + 5 < batchedData.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenRequests)
        );
      }

      if (i + 5 < batchedData.length && i + 1 == 20) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
        console.log("waiting for 20 batch");
      }
    }

    console.log("All batches processed successfully.");
  } catch (error) {
    console.error("Error sending data to Zoho Creator:", error.message);
    throw error;
  }
}

async function main(jobiddata) {
  try {
    const accessToken = await getZohoAccessToken();
    const jobiddata = await getJobid(accessToken);

    // const jobiddata = await getJobid(accessToken);

    console.log("jobiddata", jobiddata);

    // wait for 10sec

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const responseData = await fetchDataFromZohoAnalytics(
      accessToken,
      jobiddata
    );

    console.log("responseData", responseData);

    const filteredData = responseData.filter(
      (entry) =>
        entry["Balance Quantity"] !== "0.00" && entry["Status"] !== "Inactive"
    );

    const groupedData = groupDataByProductId(filteredData);

    const completedata = Object.keys(groupedData).map((productId) => ({
      Item_ID: productId,
      Product_Name: groupedData[productId].itemName,
      Batch_Details: groupedData[productId].batchDetails,
    }));

    // convert complete data to json

    fs.writeFileSync("data.json", JSON.stringify(completedata, null, 4));

    // process.exit(0);

    return;

    const batchSize = 200;
    const batchedData = [];

    for (let i = 0; i < completedata.length; i += batchSize) {
      batchedData.push(completedata.slice(i, i + batchSize));
    }

    // Send batches to Zoho Creator with retry logic

    responses = await sendDataToZohoCreator(batchedData, accessToken);
  } catch (error) {
    console.log("error", error);
  }
}

exports.main = main;

// module.exports = main;

// main();

// getZohoAccessToken().then((data) => {
//   console.log(data);
// });

// cron.schedule("00 17   *", () => {
//   console.log("Running script at 2 PM daily...");
//   main();
// });
