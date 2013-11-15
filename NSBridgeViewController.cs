using System;
using System.Drawing;

using MonoTouch.Foundation;
using MonoTouch.UIKit;

namespace NSBridgeExamples
{
    public partial class NSBridgeViewController : UIViewController
	{
        public UIWebView NSBWebView { 
			get {
				return webView;
			}
		}
		
		static bool UserInterfaceIdiomIsPhone {
			get { return UIDevice.CurrentDevice.UserInterfaceIdiom == UIUserInterfaceIdiom.Phone; }
		}

        public NSBridgeViewController ()
            : base (UserInterfaceIdiomIsPhone ? "NSBridgeViewController_iPhone" : "NSBridgeViewController_iPad", null)
		{
		}
		
		public override void DidReceiveMemoryWarning ()
		{
			base.DidReceiveMemoryWarning ();

		}
		
		public override void ViewDidLoad ()
		{
			base.ViewDidLoad ();
		}
		
	}
}

