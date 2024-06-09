# Position Based Dynamics (PBD)

Final project of 112-2 ICG course. The project implement several basic simulation with PBD. 

# How to run

You have to install `Node.js` and `npm` on your computer.

```
$ npm install 
$ npm run dev
```

Now the demo scene will be on [http://localhost:5173/](http://localhost:5173/).

We create following scenes (click the link to open):
- [Basic](http://localhost:5173/): This is a simple scene with a flag and a bunny. 
- [Bunnies](http://localhost:5173/bunnies): Two bunnies connected by a distance constraint.
- [Flags](http://localhost:5173/flags): Three flags with different constraints and textures.
- [Pendulums](http://localhost:5173/pendulums): Three pendulums with different configs.

In each scene one can interact with the objects.

# Division of the work
- [B10401006 洪愷希](https://github.com/kc0506): 
    - Basic framework
    - Cloth (flag) simulation
    - Object interaction
    - Object collision
- [B10502010 王維勤](https://github.com/wwchin): 
    - Soft body (bunny) simulation
    - pendulum simulation