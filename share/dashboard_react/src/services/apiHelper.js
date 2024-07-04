export default function authHeader(authValue = 1, contentType = 'json') {
  let headerObj = {
    ...getContentType(contentType),
    Accept: '*/*'
  }
  if (authValue === 1) {
    let accessToken = localStorage.getItem('user_token')
    headerObj = {
      ...headerObj,
      Authorization: `Bearer ${accessToken}`
    }
  }
  return headerObj
}

const getContentType = (type) => {
  if (type === 'json') {
    return { 'Content-Type': 'application/json; charset="utf-8"' }
  }
  return {}
}

export function getRequest(apiUrl, params, authValue = 1) {
  return fetch(`/api/${apiUrl}`, {
    method: 'GET',
    headers: authHeader(authValue),
    ...(params ? { body: JSON.stringify(params) } : {})
  }).then((response) => response.json())
}

export async function postRequest(apiUrl, params, authValue = 1) {
  try {
    const response = await fetch(`/api/${apiUrl}`, {
      method: 'POST',
      headers: authHeader(authValue), // Spread the headers from authHeader
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      // Handle HTTP errors
      const contentType = response.headers.get('Content-Type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.message)
      } else if (contentType && contentType.includes('text/plain')) {
        // Handle plain text response
        const textData = await response.text()
        throw new Error(textData)
      }
    }

    // Assuming the response is JSON
    const data = await response.json()
    return data
  } catch (error) {
    // Handle other errors (e.g., network issues)
    console.error('Error:', error)
    throw error
  }
}
