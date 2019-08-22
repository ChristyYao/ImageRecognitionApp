import React from 'react';
import { Text, View, TouchableOpacity, FlatList } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const Clarifai = require('clarifai');

const clarifai = new Clarifai.App({
  apiKey: '86b315778aff46dd8df4933c08ab067d',
});
process.nextTick = setImmediate;

export default class CameraExample extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    predictions: [],
  };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }
  capturePhoto = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync();
      return photo.uri;
    }
  };
  resize = async photo => {
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      photo,
      [{ resize: { height: 300, width: 300 } }],
      { base64: true }
    );
    return manipulatedImage.base64;
  };
  predict = async image => {
    let predictions = await clarifai.models.predict(
      Clarifai.GENERAL_MODEL,
      image
    );
    return predictions;
  };
  objectDetection = async () => {
    let photo = await this.capturePhoto();
    let resized = await this.resize(photo);
    let predictions = await this.predict(resized);
    this.setState({ predictions: predictions.outputs[0].data.concepts });
  };

  render() {
    const { hasCameraPermission, predictions } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera ref={ref => {
              this.camera = ref;
            }} style={{ flex: 1 }} type={this.state.type}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                <View
                style={{
                  flex: 1,
                  alignSelf: 'flex-start',
                  alignItems: 'center',
                  paddingTop: 50,
                }}
              >
                <FlatList
                  data={predictions.map(prediction => ({
                    key: `${prediction.name} ${(prediction.value.toFixed(2))*100}%`,
                  }))}
                  renderItem={({ item }) => (
                    <Text style={{ paddingLeft: 15, color: 'white', fontSize: 20 }}>{item.key}</Text>
                  )}
                />
              </View>
              <TouchableOpacity
                style={{
                  flex: 0.15,
                  alignSelf: 'center',
                  alignItems: 'center',
                  width:100,
                  height:100,
                  backgroundColor:'#fff',
                  borderRadius:50,
                }}
                onPress={this.objectDetection}
              >
                <Ionicons name="md-camera" size={50} color="black" style={{ padding: 15 }} />
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}