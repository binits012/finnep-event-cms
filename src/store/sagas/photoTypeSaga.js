/* eslint-disable prettier/prettier */
import { takeLatest, call, put } from "redux-saga/effects";
// import homeServices from '../services/';

import {
  photoType,
  putPhotoType
} from "../reducers/photoTypeSlice";
import apis from "../../services/apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showMessage, hideMessage } from "react-native-flash-message";

const storePhotoTypes = async (data) => {
  try { 
    await AsyncStorage.setItem("phototypes", data.photoType); 
  } catch (e) {
    // saving error
    console.log(e);
    alert("Error in storing data");
  }
};

function* photoTypeFlow(action) {
  try {
    const response = yield call(apis.auth.login, action.payload);
    // console.log(response);
    const {
      data: {
        data: { photoType },
      },
    } = response;
    // const {...response.data.data.usertypedetail, ...response.data.data.userdetail} = user;
    yield put(putPhotoType({ ...photoType,   }));
    yield call(storePhotoTypes(response.data.data.photoType));
    // showMessage({
    //   message: "Login success !!!",
    //   type: "success",
    // });
    // yield call(storeTokens(response.data.data.token));
  } catch (errorPromise) {
    const error = yield errorPromise;
    yield put(loginError({ message: "Login" }));
    //  showMessage({
    //   message: "Login failed !!!",
    //   type: "danger",
    // });
    // yield put(eventListError(error));
    // console.log('error in user', error);
    // console.log('error in user', error.response);
  }
} 

function* photoTypeWatcher() {
  yield takeLatest(photoType, photoTypeFlow); 
}

export default photoTypeWatcher;
