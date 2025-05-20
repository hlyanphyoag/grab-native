import CustomButton from '@/components/CustomButton'
import CustomKeyboardAvoiding from '@/components/CustomKeyboardAvoiding'
import InputField from '@/components/InputField'
import OAuth from '@/components/OAuth'
import { icons, images } from '@/constants'
import { useSignIn } from '@clerk/clerk-react'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'

export default function SignIn() {
  const [ form,  setForm ] = useState({
    email: '',
    password: ''
  })

  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()


  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(root)/(tabs)/Home')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }


  return (
    <ScrollView className='flex-1 bg-white'>
        <View className='flex-1 bg-white'>
            <View className='h-[250] relative'>
              <Image source={images.signUpCar} className='h-[250] z-0 w-full'/>
              <Text className='text-2xl text-black font-JakartaSemiBold left-5 absolute bottom-5'>Welcome</Text>
            </View>

            <CustomKeyboardAvoiding>
                <InputField 
                  label = 'Email'
                  placeholder='Enter your email'
                  icon = {icons.email}
                  textContentType='emailAddress'
                  value={form.email}
                  onChangeText = {(value : any) => setForm({...form, email: value})}
                />
                <InputField 
                  label = 'Passeword'
                  placeholder='Enter your password'
                  icon = {icons.lock}
                  textContentType='password'
                  secureTextEntry={true}
                  value={form.password}
                  onChangeText = {(value : any) => setForm({...form, password: value})}
                />

                <CustomButton
                  title='Sign In' 
                  className='mt-6'
                  onPress={onSignInPress}
                  />

                  {/* OAuth */}
                  <OAuth />

                  <View className='flex-row justify-center items-center mt-5 text-lg gap-x-2'>
                       <Text className='text-sm font-JakartaRegular text-general-200'>Already have an account?</Text>
                        <Link href={'/(auth)/SignUp'} className='font-JakartaSemiBold text-sm text-primary-500'>Sign up</Link>
                  </View>
            </CustomKeyboardAvoiding>
        </View>
    </ScrollView>
  )
}