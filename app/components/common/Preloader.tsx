'use client'

import AsianInspiredDoor from '../models/AsianInspiredDoor'

// List of models to preload.
const MODELS = [AsianInspiredDoor];

const Preloader = () => {
  // Mounting the models is enough to pull them through useGLTF/Suspense so they
  // are cached and counted by useProgress. They stay invisible: <Preload all />
  // temporarily flips visible=false objects on to compile their materials and
  // flips them back, so nothing here needs to be rendered to the screen.
  //
  // Previously these were rendered visible for one tick and hidden via
  // setTimeout. Because they mount at the world origin — right in front of the
  // starting camera — that frame stayed on screen for as long as the main
  // thread was busy parsing the GLB and compiling shaders, flashing a
  // full-screen door just as the canvas faded in.
  return (<>
    {MODELS.map((Component, index) => (
      <Component key={index} visible={false} />
    ))}
  </>)
}

export default Preloader;
