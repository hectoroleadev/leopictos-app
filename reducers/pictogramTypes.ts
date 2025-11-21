import { Pictogram } from '../types';

export interface PictogramState {
  pictograms: Pictogram[];
  loading: boolean;
  loadingExamples: boolean;
  error: string | null;
}

export enum PictogramActionTypes {
  FETCH_START = 'FETCH_START',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_ERROR = 'FETCH_ERROR',
  
  ADD_START = 'ADD_START', // Optional, if you want granular loading for adding
  ADD_SUCCESS = 'ADD_SUCCESS',
  
  DELETE_PICTOGRAM = 'DELETE_PICTOGRAM',
  DELETE_FAILURE = 'DELETE_FAILURE', // To rollback optimistic updates
  
  UPDATE_PICTOGRAM = 'UPDATE_PICTOGRAM',
  
  REORDER_PICTOGRAMS = 'REORDER_PICTOGRAMS',
  
  GENERATE_EXAMPLES_START = 'GENERATE_EXAMPLES_START',
  GENERATE_EXAMPLES_SUCCESS = 'GENERATE_EXAMPLES_SUCCESS',
  GENERATE_EXAMPLES_ERROR = 'GENERATE_EXAMPLES_ERROR'
}

export type PictogramAction = 
  | { type: PictogramActionTypes.FETCH_START }
  | { type: PictogramActionTypes.FETCH_SUCCESS; payload: Pictogram[] }
  | { type: PictogramActionTypes.FETCH_ERROR; payload: string }
  | { type: PictogramActionTypes.ADD_SUCCESS; payload: Pictogram }
  | { type: PictogramActionTypes.DELETE_PICTOGRAM; payload: string }
  | { type: PictogramActionTypes.DELETE_FAILURE; payload: Pictogram[] } // Rollback payload
  | { type: PictogramActionTypes.UPDATE_PICTOGRAM; payload: { id: string; updates: Partial<Pictogram> } }
  | { type: PictogramActionTypes.REORDER_PICTOGRAMS; payload: Pictogram[] }
  | { type: PictogramActionTypes.GENERATE_EXAMPLES_START }
  | { type: PictogramActionTypes.GENERATE_EXAMPLES_SUCCESS; payload: Pictogram[] }
  | { type: PictogramActionTypes.GENERATE_EXAMPLES_ERROR; payload: string };