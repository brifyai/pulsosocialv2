// Based on https://codepen.io/inlet/pen/yLVmPWv.
// Copyright (c) 2018 Patrick Brouwer, distributed under the MIT license.

import { PixiComponent, useApp } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import { Application } from 'pixi.js';
import { MutableRefObject, ReactNode } from 'react';

export type ViewportProps = {
  app: Application;
  viewportRef?: MutableRefObject<Viewport | undefined>;

  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  children?: ReactNode;
};

// https://davidfig.github.io/pixi-viewport/jsdoc/Viewport.html
export default PixiComponent('Viewport', {
  create(props: ViewportProps) {
    const { app, children, viewportRef, ...viewportProps } = props;
    
    // Fix: Verificar que events existe antes de pasarlo a Viewport
    // El error "Cannot read properties of null (reading 'removeEventListener')"
    // ocurre cuando app.renderer.events es null durante la destrucción
    const events = app.renderer.events;
    
    const viewport = new Viewport({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      events: events || undefined,
      passiveWheel: false,
      ...viewportProps,
    });
    if (viewportRef) {
      viewportRef.current = viewport;
    }
    // Activate plugins
    viewport
      .drag()
      .pinch({})
      .wheel()
      .decelerate()
      .clamp({ direction: 'all', underflow: 'center' })
      .setZoom(-10)
      .clampZoom({
        minScale: (1.04 * props.screenWidth) / (props.worldWidth / 2),
        maxScale: 3.0,
      });
    return viewport;
  },
  applyProps(viewport, oldProps: any, newProps: any) {
    Object.keys(newProps).forEach((p) => {
      if (p !== 'app' && p !== 'viewportRef' && p !== 'children' && oldProps[p] !== newProps[p]) {
        // @ts-expect-error Ignoring TypeScript here
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        viewport[p] = newProps[p];
      }
    });
  },
  // Fix: Agregar destroy personalizado para manejar el cleanup correctamente
  // El error "Cannot read properties of null (reading 'removeEventListener')"
  // ocurre porque pixi-viewport intenta remover listeners de un objeto null
  // 
  // Solución: Simplemente marcar como destruido sin llamar a métodos que puedan fallar
  destroy(instance) {
    if (instance) {
      // Remover event listeners de forma segura
      try {
        if (typeof instance.removeAllListeners === 'function') {
          instance.removeAllListeners();
        }
      } catch (e) {
        // Ignorar errores al remover listeners
      }
      
      // Marcar como destruido y limpiar referencias
      try {
        instance.destroyed = true;
        // Limpiar referencias internas que podrían causar memory leaks
        // @ts-expect-error - propiedades internas de pixi-viewport
        if (instance.plugins) {
          // @ts-expect-error
          instance.plugins = {};
        }
        // @ts-expect-error
        if (instance._events) {
          // @ts-expect-error
          instance._events = {};
        }
      } catch (e) {
        // Ignorar errores durante la limpieza
      }
    }
  },
});
