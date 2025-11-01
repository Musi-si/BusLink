import { ReactNode } from 'react';
import { Map as LeafletMap, LatLngExpression, Icon, DivIcon, PathOptions } from 'leaflet';

declare module 'react-leaflet' {
  import { ComponentType } from 'react';

  export interface MapContainerProps {
    center?: LatLngExpression;
    zoom?: number;
    className?: string;
    zoomControl?: boolean;
    style?: React.CSSProperties;
    children?: ReactNode;
    [key: string]: any;
  }

  export interface MarkerProps {
    position: LatLngExpression;
    icon?: Icon | DivIcon;
    eventHandlers?: {
      [key: string]: (...args: any[]) => void;
    };
    children?: ReactNode;
    [key: string]: any;
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
    [key: string]: any;
  }

  export interface PopupProps {
    children?: ReactNode;
    [key: string]: any;
  }

  export interface PolylineProps {
    positions: LatLngExpression[] | LatLngExpression[][];
    pathOptions?: PathOptions;
    [key: string]: any;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Polyline: ComponentType<PolylineProps>;
  
  export function useMap(): LeafletMap;
}
