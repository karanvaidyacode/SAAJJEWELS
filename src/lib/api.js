// When using Vite's proxy, we don't need the full URL
const API_URL = "";

export async function fetchApi(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Get admin token from localStorage if available
  const adminToken = localStorage.getItem("adminToken");
  
  // Add admin token to headers if it exists
  if (adminToken) {
    defaultOptions.headers["x-admin-token"] = adminToken;
  }

  try {
    // If body is FormData, don't set Content-Type header (browser will set it with boundary)
    if (options.body instanceof FormData) {
      delete defaultOptions.headers["Content-Type"];
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    });

    // Try to parse JSON safely
    let data = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const message =
        (data && (data.detail || data.message || data)) ||
        `HTTP error ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    return data;
  } catch (err) {
    console.error("API Error:", err);
    // Enhance error information
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      const networkError = new Error('Network error - please check if the backend server is running');
      networkError.type = 'NETWORK_ERROR';
      throw networkError;
    }
    if (err instanceof Error) throw err;
    throw new Error("Network error - please check your connection");
  }
}

export default fetchApi;