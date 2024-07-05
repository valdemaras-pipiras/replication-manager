import { createSlice } from '@reduxjs/toolkit'

export const commonSlice = createSlice({
  name: 'common',
  initialState: { theme: 'light', isMobile: false,
  isTablet: false,
  isDesktop: false },
  reducers: {
    setTheme: (state, action) => {
      localStorage.setItem('theme', action.payload.theme)
      state.theme = action.payload.theme
    },
     setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    setIsTablet: (state, action) => {
      state.isTablet = action.payload;
    },
    setIsDesktop: (state, action) => {
      state.isDesktop = action.payload;
    },
  }
})



// this is for dispatch
export const { setTheme , setIsMobile, setIsTablet, setIsDesktop} = commonSlice.actions

// this is for configureStore
export default commonSlice.reducer
