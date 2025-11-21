import { PictogramState, PictogramAction, PictogramActionTypes } from './pictogramTypes';

export const initialState: PictogramState = {
  pictograms: [],
  loading: false,
  loadingExamples: false,
  error: null
};

export const pictogramReducer = (state: PictogramState, action: PictogramAction): PictogramState => {
  switch (action.type) {
    case PictogramActionTypes.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case PictogramActionTypes.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        pictograms: action.payload,
        error: null
      };
    case PictogramActionTypes.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case PictogramActionTypes.ADD_SUCCESS:
      return {
        ...state,
        pictograms: [action.payload, ...state.pictograms]
      };
    case PictogramActionTypes.DELETE_PICTOGRAM:
      return {
        ...state,
        pictograms: state.pictograms.filter(p => p.id !== action.payload)
      };
    case PictogramActionTypes.DELETE_FAILURE:
      return {
        ...state,
        pictograms: action.payload, // Rollback to previous state
        error: "No se pudo eliminar el pictograma."
      };
    case PictogramActionTypes.UPDATE_PICTOGRAM:
      return {
        ...state,
        pictograms: state.pictograms.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };
    case PictogramActionTypes.REORDER_PICTOGRAMS:
      return {
        ...state,
        pictograms: action.payload
      };
    case PictogramActionTypes.GENERATE_EXAMPLES_START:
      return {
        ...state,
        loadingExamples: true
      };
    case PictogramActionTypes.GENERATE_EXAMPLES_SUCCESS:
      return {
        ...state,
        loadingExamples: false,
        pictograms: [...action.payload, ...state.pictograms] // Append new ones at top
      };
    case PictogramActionTypes.GENERATE_EXAMPLES_ERROR:
      return {
        ...state,
        loadingExamples: false,
        error: action.payload
      };
    default:
      return state;
  }
};