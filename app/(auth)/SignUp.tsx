import CustomButton from '@/components/CustomButton'
import CustomKeyboardAvoiding from '@/components/CustomKeyboardAvoiding'
import InputField from '@/components/InputField'
import OAuth from '@/components/OAuth'
import { icons, images } from '@/constants'
import { fetchAPI } from '@/libs/fetch'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Image, ScrollView, Text, View } from 'react-native'
import Modal from 'react-native-modal'

export default function SignUp() {

  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
 
  const [ form, setForm ] = useState({
    name: "",
    email: "",
    password: ""
  })
 
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: ""
  });

  const [ successModal, setShowSuccessModal ] = useState(false);

  


  const onSignUpPress = async () => {
    if (!isLoaded) return
    console.log("Form" , form)
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setVerification({
        ...verification,
        state: "pending"
      })
    } catch (err : any) {
      Alert.alert("Error", err.errors[0].longMessage)
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (completeSignUp.status === 'complete') {

        console.log('clerkId:', completeSignUp.createdUserId)
        // Create a database user
        await fetchAPI("/(api)/user", {
          method: "POST",
          body:JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId
          })
        })

        await setActive({ session: completeSignUp.createdSessionId })
        setVerification({...verification, state: "success"})
      } else {
        setVerification({...verification, state: "failed"})
        console.error(JSON.stringify(completeSignUp, null, 2))
      }
    } catch (err: any) {
      setVerification({...verification, state: "failed" , error: err.errors[0].longMessage})
      console.error(JSON.stringify(err, null, 2))
    }
  }


  return (
    <ScrollView className='flex-1 bg-white' >
      <View className='flex-1 bg-white'>
          <View className='relative h-[250]'>
              <Image source={images.signUpCar} className='w-full h-[250] z-0'/>
              <Text className='absolute bottom-5 text-2xl text-black font-JakartaSemiBold left-5'>Create Your Account</Text>
          </View>
          
         
         <CustomKeyboardAvoiding>
                  <InputField 
                  label='Name' 
                  placeholder='Enter your name'
                  icon = {icons.person}
                  value = {form.name}
                  onChangeText = {(value)  => setForm({...form, name: value})}
                  />
                  <InputField 
                  label='Email' 
                  placeholder='Enter your email'
                  icon = {icons.email}
                  value = {form.email}
                  textContentType = 'emailAddress'
                  onChangeText = {(value)  => setForm({...form, email: value})}
                  />
                  <InputField 
                  label='Password' 
                  placeholder='Enter your password'
                  icon = {icons.lock}
                  value = {form.password}
                  secureTextEntry={true}
                  textContentType='password'
                  onChangeText = {(value)  => setForm({...form, password: value})}
                  />
                  
                  <CustomButton 
                  title='Sign Up' 
                  className='mt-6'
                  onPress={onSignUpPress}
                  />

                  {/* OAuth */}
                  <OAuth />

                  {/* Sign In */}
                  <View className='flex-row justify-center items-center mt-5 text-lg gap-x-2'>
                      <Text className='text-sm font-JakartaRegular text-general-200'>Already have an account?</Text>
                      <Link href={'/(auth)/SignIn'} className='font-JakartaSemiBold text-sm text-primary-500'>Sign In</Link>
                  </View>


                  {/* Verification Modals */}

                  <Modal isVisible = {verification.state === 'pending'} onModalHide={() => {if(verification.state === 'success') return setShowSuccessModal(true)}}>
                      <View className='min-h-[300px] py-9 px-7 bg-white rounded-2xl'>
            
                          <Text className='text-3xl font-JakartaBold text-center mb-2'>Verified</Text>
                          <Text className='text-center font-Jakarta text-gray-400 mb-5'>We have sent the code to {form.email}.</Text>
                          <InputField 
                          label='Code' 
                          icon={icons.lock} 
                          keyboardType="numeric"
                          value={verification.code} 
                          placeholder='123xxxx'
                          onChangeText={(value) => setVerification({...verification, code: value})}
                          />
                          {verification.error && <View>
                            <Text className='text-red-500 mt-1 text-sm'>{verification.error}</Text>  
                          </View>}
                          <CustomButton title='Verify Email' onPress={onVerifyPress} className='mt-5 bg-success-500'/>
                      </View>
                  </Modal>

                  <Modal isVisible = {successModal}>
                      <View className='min-h-[300px] py-9 px-7 bg-white rounded-2xl'>
                          <Image source={images.check} className='w-[100px] h-[100px] my-5 mx-auto'/>
                          <Text className='text-3xl font-JakartaBold text-center'>Verified</Text>
                          <Text className='text-center text-base text-gray-400 mt-2'>You have successfully verified your account!</Text>
                          <CustomButton title='Browse Home' onPress={() => {
                            setShowSuccessModal(false)
                             router.push('/(root)/(tabs)/Home') }}className='mt-5'/>
                      </View>
                  </Modal>
                  </CustomKeyboardAvoiding>     
      </View>
    </ScrollView>
  )
}