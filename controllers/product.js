const axios = require("axios");

// inventory creds
const zohoClientId = "1000.ZW53NLBZ0Y1A3DG0LGWF0NU3N2ZTPI";
const zohoClientSecret = "e80a1e3106a5e9e079908efebf32625c0185900ae1";
const zohoRefreshToken =
  "1000.b5ecc407637fc30c4bf4c0787a28ca4b.9a50b3b5535946bf3bf7cb7cade7f2ee";

let access_token_inventory;

getZohoAccessToken()
  .then((access_token) => {
    access_token_inventory = access_token;
    console.log("access_token_inventory", access_token_inventory);
  })
  .catch((error) => {
    console.log("error", error);
  });

setInterval(async () => {
  access_token_inventory = await getZohoAccessToken();
  console.log("access_token_inventory", access_token_inventory);
}, 1000 * 60 * 60);

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

    // console.log("response", response);
    return response.data.access_token;
  } catch (error) {
    console.log("error", error);
  }
}

const ZOHO_INVENTORY_API_URL = "https://www.zohoapis.in/inventory/v1/items";
const ORGANIZATION_ID = "60015983411";
const CUSTOM_FIELD = "custom_field_951651000004594119";
const SEARCH_VALUE = "Packaging";
const PER_PAGE = 200;

exports.fetchAllItemsFromZohoInventory = async () => {
  let allItems = [];
  let page = 1;
  let itemsFetched;

  try {
    do {
      // const access_token_inventory = await getZohoAccessToken();
      const response = await axios.get(ZOHO_INVENTORY_API_URL, {
        headers: {
          Authorization: `Zoho-oauthtoken ${access_token_inventory}`,
        },
        params: {
          [`${CUSTOM_FIELD}_contains`]: SEARCH_VALUE,
          page: page,
          per_page: PER_PAGE,
          organization_id: ORGANIZATION_ID,
        },
      });

      itemsFetched = response.data.items
        .filter(
          (item) =>
            item.available_stock > 0 &&
            item.status === "active" &&
            !item.track_batch_number
        )
        .map((item) => ({
          item_id: item.item_id,
          item_name: item.item_name,
          unit: item.unit,
          available_stock: item.available_stock,
        }));

      allItems = allItems.concat(itemsFetched);
      page += 1;
    } while (itemsFetched.length > 0);

    return allItems;
  } catch (error) {
    console.error(
      "Error fetching items from Zoho Inventory:",
      error.response.data
    );
    throw error.response.data;
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await exports.fetchAllItemsFromZohoInventory();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Error fetching items" });
  }
};

// get all item_name

exports.getItemNames = async (req, res) => {
  try {
    const items = await exports.fetchAllItemsFromZohoInventory();
    const itemNames = items.map((item) => item.item_name);
    res.json(itemNames);
  } catch (error) {
    res.status(500).json({ error });
  }
};

// get item detail by item_name

exports.getItemDetail = async (req, res) => {
  if (!req.body.item_name) {
    return res.status(400).json({ error: "item_name is required" });
  }

  try {
    const items = await exports.fetchAllItemsFromZohoInventory();
    const itemDetail = items.find(
      (item) => item.item_name === req.body.item_name
    );
    res.json(itemDetail);
  } catch (error) {
    res.status(500).json({ error: "Error fetching items" });
  }
};
