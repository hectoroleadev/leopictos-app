import { Pictogram } from '../types';
import { PictogramAction, PictogramActionTypes } from './pictogramTypes';

export const fetchStart = (): PictogramAction => ({
  type: PictogramActionTypes.FETCH_START
});

export const fetchSuccess = (pictograms: Pictogram[]): PictogramAction => ({
  type: PictogramActionTypes.FETCH_SUCCESS,
  payload: pictograms
});

export const fetchError = (error: string): PictogramAction => ({
  type: PictogramActionTypes.FETCH_ERROR,
  payload: error
});

export const addSuccess = (pictogram: Pictogram): PictogramAction => ({
  type: PictogramActionTypes.ADD_SUCCESS,
  payload: pictogram
});

export const deletePictogramAction = (id: string): PictogramAction => ({
  type: PictogramActionTypes.DELETE_PICTOGRAM,
  payload: id
});

export const deleteFailure = (previousPictograms: Pictogram[]): PictogramAction => ({
  type: PictogramActionTypes.DELETE_FAILURE,
  payload: previousPictograms
});

export const updatePictogramAction = (id: string, updates: Partial<Pictogram>): PictogramAction => ({
  type: PictogramActionTypes.UPDATE_PICTOGRAM,
  payload: { id, updates }
});

export const reorderPictogramsAction = (pictograms: Pictogram[]): PictogramAction => ({
  type: PictogramActionTypes.REORDER_PICTOGRAMS,
  payload: pictograms
});

export const generateExamplesStart = (): PictogramAction => ({
  type: PictogramActionTypes.GENERATE_EXAMPLES_START
});

export const generateExamplesSuccess = (newPictograms: Pictogram[]): PictogramAction => ({
  type: PictogramActionTypes.GENERATE_EXAMPLES_SUCCESS,
  payload: newPictograms
});

export const generateExamplesError = (error: string): PictogramAction => ({
  type: PictogramActionTypes.GENERATE_EXAMPLES_ERROR,
  payload: error
});