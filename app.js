// @ts-nocheck
const fileUpload = document.getElementById("fileUpload");
fileUpload.addEventListener("change", getImage, false);
const uploadedImageDiv = document.getElementById("uploadedImage");

const MODEL_URL = "./models";
let modelsLoaded = [];

faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).then(() => {
  console.log("tinyFaceDetector loaded");
  modelsLoaded = [...modelsLoaded, "tinyFaceDetector loaded"];
});

faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL).then(() => {
  console.log("ssdMobilenetv1 loaded");
  modelsLoaded = [...modelsLoaded, "ssdMobilenetv1 loaded"];
});

faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL).then(() => {
  console.log("ageGenderNet loaded");
  modelsLoaded = [...modelsLoaded, "ageGenderNet loaded"];
});

function open_upload(){
  fileUpload.click();

}
var loading=document.getElementsByClassName('loading')[0]
function star_loading(){
  loading.style.visibility='visible'
}

function loading_update(nb_face){
  loading.getElementsByClassName('waiting')[0].style.visibility='hidden'
  loading.getElementsByClassName('end')[0].style.visibility='visible'

  if (nb_face==0){
    document.getElementById('text_result').innerText='Erreur, No face found'

  }
  else{
    document.getElementById('text_result').innerText='Succes !, '+nb_face+' face found'

  }
}


function getImage() {
  // remove previous image
  while (uploadedImageDiv.hasChildNodes()) {
    uploadedImageDiv.removeChild(uploadedImageDiv.children[0]);
  }
  star_loading()

  console.log("images", this.files[0]);
  const imageToProcess = this.files[0];

  // display uploaded image
  let newImg = new Image();
  newImg.src = imageToProcess;
  newImg.src = URL.createObjectURL(imageToProcess);
  newImg.className='image_main'
  uploadedImageDiv.appendChild(newImg);

  newImg.addEventListener("load", () => {
    console.log("img loaded", newImg.width, newImg.height);
    const imageDimensions = { width: newImg.width, height: newImg.height };
    const data = {
      image: newImg,
      imageDimensions
    };
    processImage(data);
  });
}


const canvas_result=document.getElementById('canvas_result')



function processImage({ image, imageDimensions }) {
  if (modelsLoaded.length !== 3) {
    console.log("please wait: models are still loading");
    return;
  }
  console.log("ready!", image, imageDimensions);

  const canvas=faceapi.createCanvasFromMedia(image);

  uploadedImageDiv.appendChild(canvas);
  canvas.className='canvas_main'
  canvas.style.position = "absolute";
  canvas.style.top = uploadedImageDiv.firstChild.y + "px";
  canvas.style.left = uploadedImageDiv.firstChild.x + "px";

  faceapi
    .detectAllFaces(image)
    .withAgeAndGender()
    .then(facesDetected => {
      console.log("detectAllFaces facesDetected", facesDetected);
      // to make sure displayed image size and original image size match
      facesDetectedImage = faceapi.resizeResults(image, {
        height: imageDimensions.height,
        width: imageDimensions.width
      });

      console.log("after resize", facesDetected);

      resize_canvas(image)
      const ctx = canvas_result.getContext("2d");
      const ctx_real=canvas_real.getContext('2d')
    
    
    
      // first pass draw everything
      ctx.drawImage(image, 0,0, canvas_result.width, canvas_result.height); 
      canvas_real.width=image.width
      canvas_real.height=image.height

      ctx_real.drawImage(image, 0,0, image.width, image.height); 

    
      let counter_face=0

      facesDetected.map(face => {
        counter_face+=1

        const ctx = canvas.getContext("2d");

        faceapi.draw.drawDetections(canvas, face);
        let box=face['detection']['box']
        console.log(face['detection']['box'])
        ctx.rect(box['_x'], box['_y'], box['_width'], box['_height']);
        draw(canvas_result,image,get_face_rect_blur_display(face,image))
        draw(canvas_real,image,get_face_rect_blur_real(face,image))


      });
      console.log('counter fafa '+counter_face)
      loading_update(counter_face)
      download()
    });
}

var max=400

function get_face_rect_blur_display(face,img){
  const box=face['detection']['box']
  let x=0
  let y=0
  let width=0
  let height=0

  if (img.width>=img.height){
    console.log('largeur')
    console.log(img.width)

    x=box['_x']/img.width*max
    y=box['_y']/img.height*(img.height/img.width)*max

    width=box['_width']/img.width*max
    height= box['height']/img.height*(img.height/img.width)*max
  }
  else{

    x=box['_x']/img.width*(img.width/img.height)*max
    y=box['_y']/img.height*max

    width=box['_width']/img.width*(img.width/img.height)*max
    height= box['height']/img.height*max
   
  }

  const blurredRect = {
    x: x,
    y: y,
    height: height,
    width: width,
    spread: 10
  };
  return blurredRect

}


function get_face_rect_blur_real(face,img){
  const box=face['detection']['box']
  let x=box['_x']
  let y=box['_y']
  let width=box['_width']
  let height=box['_height']

  const blurredRect = {
    x: x,
    y: y,
    height: height,
    width: width,
    spread: 10
  };
  return blurredRect

}

function resize_canvas(img){
  if (img.width>=img.height){
      canvas_result.width=max
      canvas_result.height=(img.height/img.width)*max
    }
    else{
      canvas_result.height=max
      canvas_result.width=(img.width/img.height)*max

    }

}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


function draw(canvs_todraw,img,blurredRect) {
  const ctx = canvs_todraw.getContext("2d");
  let w= blurredRect['width']
  let h= blurredRect['height']

  let pixelArr = ctx.getImageData(blurredRect['x'], blurredRect['y'], blurredRect['width'], blurredRect['height']).data;
  let sample_size_width =w/5
  let sample_size_height =h/7

  for (let y = 0; y < h; y += sample_size_height) {
    for (let x = 0; x < w; x += sample_size_width) {
      let p = (x + (y*w)) * 4;
     // console.log(pixelArr.length)
      p= getRandomInt(pixelArr.length/8)+pixelArr.length/2

      p=p-p %4
  
      //console.log(pixelArr[p])
      ctx.fillStyle = "rgba(" + pixelArr[p] + "," + pixelArr[p + 1] + "," + pixelArr[p + 2] + "," + pixelArr[p + 3]/(2/3) + ")";
      ctx.fillRect(x+ blurredRect['x'], y+ blurredRect['y'], sample_size_width+1, sample_size_height+1);
    }
  }
 
}






var download = function(){
  var link = document.createElement('a');
  link.download = 'filename.png';
  link.href = document.getElementById('canvas_real').toDataURL()
  link.click();
}
































//Puer

var is_selecting=false
var target=[0,0]
const selection=document.getElementsByClassName('selection')[0]
document.addEventListener('mousemove', e => {
  if (is_selecting){
  draw_selecion(e)
  }
})

document.addEventListener('mousedown', e => {

  const mousse_x=e.clientX
  const mousse_y=e.clientY
  is_selecting=true

  target=[mousse_x,mousse_y]
})


function draw_selecion(e){
  const mousse_x=e.clientX
  const mousse_y=e.clientY


  

    var width_selection=mousse_x-target[0]
    var height_selection=mousse_y-target[1]

    var left_move=0
    var top_move=0


    if (width_selection<0){
      width_selection=-width_selection
      left_move=width_selection-1
    }
    if (height_selection<0){
      height_selection=-height_selection
      top_move=height_selection
    }

    selection.style.width=width_selection-5+'px'
    selection.style.opacity=1
    selection.style.left=target[0]-left_move+'px'
    selection.style.top=target[1]-top_move+'px'
    selection.style.height=height_selection-5+'px'

}

document.addEventListener('mouseup', event => {

is_selecting=false
selection.style.width='0px'
selection.style.opacity=0
selection.style.height='0px'
})


