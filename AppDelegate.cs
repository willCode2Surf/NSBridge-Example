using System;
using System.Collections.Generic;
using System.Linq;

using MonoTouch.Foundation;
using MonoTouch.UIKit;
using NSB;


namespace NSBridgeExamples
{
	[Register ("AppDelegate")]
	public partial class AppDelegate : UIApplicationDelegate
	{
		UIWindow window;
        NSBridgeViewController viewController;

	
		public override bool FinishedLaunching (UIApplication app, NSDictionary options)
		{
            NSBridge.EnableNSBridge ();

			window = new UIWindow (UIScreen.MainScreen.Bounds);
            viewController = new NSBridgeViewController ();
			window.RootViewController = viewController;
			window.MakeKeyAndVisible ();
			
			string path = NSBundle.MainBundle.PathForResource( "www/index", "html" );
			string address = string.Format("file:{0}", path).Replace( " ", "%20" );
			
            viewController.NSBWebView.LoadRequest(new NSUrlRequest(new NSUrl(address)));
            viewController.NSBWebView.FireEvent("NSBWebEvent", new { Message = "loading url from local stash" });

            // listen for the NSBNativeEvent event triggered by the browser.
            viewController.NSBWebView.AddEventListener( "NSBNativeEvent", delegate(FireEventData arg) {
                Console.WriteLine("NSBNativeEvent Callback:");	
				Console.WriteLine(arg.Data["msg"]);
				
                // trigger NSBWebEvent event in browser.
                viewController.NSBWebView.FireEvent( "NSBWebEvent", new {
                    Message = "Hello from the native os here!",
                    Success = true
				});
			});
           
            // Scaffolding can be built out to include smarter events that contain JSON objects with instructions or
            // chisel out quick and dirty approaches to intergating things
            viewController.NSBWebView.AddEventListener( "NSBNativeSheet", delegate(FireEventData arg) {

                BeginInvokeOnMainThread (delegate { 
                    var sheet = new UIActionSheet ( "NSBAction Sheet" );
                    if(arg.Data["msg"] != null)
                        sheet.AddButton ( arg.Data["msg"].ToString() );
                    else
                        sheet.AddButton ( "You didn't enter any content!" );
                    sheet.AddButton ( "Cancel" );
                    sheet.CancelButtonIndex = 1;
                    sheet.ShowInView ( viewController.View );
                });

            });

            viewController.NSBWebView.AddEventListener( "NSBNotification", delegate(FireEventData arg) {

                BeginInvokeOnMainThread (delegate { 
                    UILocalNotification notification = new UILocalNotification ();
                    notification.FireDate = DateTime.Now.AddSeconds(15);
                    notification.AlertAction = arg.Data["title"].ToString();
                    notification.AlertBody = arg.Data["content"].ToString();
                    notification.ApplicationIconBadgeNumber += 1;
                    notification.SoundName = UILocalNotification.DefaultSoundName;

                    NSB.Utils.NotificationUtils.CreateLocalNotification(notification);
                    viewController.NSBWebView.FireEvent( "NSBLogger", new {
                        Message = "Local Notification created in Native iOS with a 15 second delay..."
                    });
                });

            });

            viewController.NSBWebView.AddEventListener( "NSBIOTest", delegate(FireEventData arg) {

                BeginInvokeOnMainThread (delegate { 


                    var bpath =  NSBundle.MainBundle.BundlePath;
                    var entries = NSB.Utils.IOUtils.GetAllFileEntries(bpath);

                    viewController.NSBWebView.FireEvent( "NSBLogger", new {
                        Message = "Local iOS Files in MainBundle.BundlePath: " + bpath
                    });
                    foreach(string entry in entries)
                    {
                        // trigger doBrowserStuff event in browser.
                        viewController.NSBWebView.FireEvent( "NSBLogger", new {
                            Message = entry
                        });
                    }


                });
            });

			return true;
		}

        public override void ReceivedLocalNotification (UIApplication application, UILocalNotification notification)
        {
            // show an alert
            new UIAlertView(notification.AlertAction, notification.AlertBody, null, "OK", null).Show();

            // reset our badge
            UIApplication.SharedApplication.ApplicationIconBadgeNumber = 0;
        }
	}
}

