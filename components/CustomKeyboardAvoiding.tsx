import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';

const CustomKeyboardAvoiding = ({children}: any ) => {
        const [keyBoardHeight, setKeyBoardHeight] = useState(0);
        useEffect(() => {
            const keyboardShow = Keyboard.addListener('keyboardDidShow', (e) => setKeyBoardHeight(e.endCoordinates.height));
            const keyBoardHide = Keyboard.addListener('keyboardDidHide', (e) => setKeyBoardHeight(0));
    
            return () => {
                keyboardShow.remove();
                keyBoardHide.remove();
            }
        },[])
  return (
    <ScrollView contentContainerStyle = {{ paddingBottom : keyBoardHeight + 20}} className='p-5'>
            {children}
    </ScrollView>
  )
}

export default CustomKeyboardAvoiding