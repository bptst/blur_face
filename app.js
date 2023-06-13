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

  loading.getElementsByClassName('waiting')[0].style.visibility='visible'
  loading.getElementsByClassName('end')[0].style.visibility='hidden'



}

function loading_update(nb_face){
  loading.getElementsByClassName('waiting')[0].style.visibility='hidden'
  loading.getElementsByClassName('end')[0].style.visibility='visible'

  if (nb_face==0){
    document.getElementById('text_result').style.color='red'
    document.getElementById('text_result').innerText='Mince, Aucun visage trouvé'
    document.getElementsByClassName('emote')[0].innerText='🚫'
    document.getElementsByClassName('download')[0].style.display='none'


  }
  else{
    document.getElementById('text_result').style.color='green'
    document.getElementById('text_result').innerText=nb_face+' visage trouvés !'
    document.getElementsByClassName('emote')[0].innerText='🎉'
    document.getElementsByClassName('download')[0].style.display='block'


   

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
  let sample_size_width =w/7
  let sample_size_height =h/10

  for (let y = 0; y < h; y += sample_size_height) {
    for (let x = 0; x < w; x += sample_size_width) {
      let p = 8+(x + (y*w)) * 4;
     // console.log(pixelArr.length)
      //p= getRandomInt(pixelArr.length/8)+pixelArr.length/2

      p=p-p%4
  
      //console.log(pixelArr[p])
      ctx.fillStyle = "rgba(" + pixelArr[p] + "," + pixelArr[p + 1] + "," + pixelArr[p + 2] + "," + pixelArr[p + 3] + ")";
      ctx.fillRect(x+ blurredRect['x'], y+ blurredRect['y'], sample_size_width+1, sample_size_height+1);
    }
  }
 
}






function download(){
  var link = document.createElement('a');
  link.download = 'filename.png';
  link.href = document.getElementById('canvas_real').toDataURL()
  link.click();
}







