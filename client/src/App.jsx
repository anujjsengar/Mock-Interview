import React from "react";

import Camera from "./component/Camere";
import QuestionGenerator from "./component/QuestionGenerator";
//import AudioRecorder from "./component/Audio";
const App = () =>{
  return (
    <div>
      {/* <nav className="flex justify-center bg-gray-100 p-4">
        <ul className="flex list-none p-0 m-0">
          <li className="mx-4 text-blue-500 hover:text-blue-700 cursor-pointer">Home</li>
          <li className="mx-4 text-blue-500 hover:text-blue-700 cursor-pointer">About</li>
        </ul>
      </nav> */}
      <main className="flex justify-center items-center h-[80vh]">
        <div>
          <h4 className="text-xl font-semibold text-gray-800 mb-4">AI-BASED MOCK INTERVIEW</h4>
          <Camera/>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-800 mb-4">AI-BASED MOCK INTERVIEW</h4>
          <QuestionGenerator/>
        </div>
        {/* <div>
          <AudioRecorder/>
        </div> */}
      </main>
    </div>
  );
}
export default App;
