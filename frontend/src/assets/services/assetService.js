
import axios from "axios";

const API_URL = "http://localhost:5000/api/assets";

// Get all assets
export const getAssets = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create asset
export const createAsset = async (assetData) => {
  const response = await axios.post(API_URL, assetData);
  return response.data;
};

// Update asset
export const updateAsset = async (id, assetData) => {
  const response = await axios.put(`${API_URL}/${id}`, assetData);
  return response.data;
};

// Delete asset
export const deleteAsset = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
