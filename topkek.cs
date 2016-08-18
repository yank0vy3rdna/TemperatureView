using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Collections.Specialized;

namespace TopKek
{
	class MainClass
	{
		private static IPAddress remoteIPAddress;
		private static int remotePort;
		private static int localPort;
		private static int countDevices;
		[STAThread]
		static void Main(string[] args)
		{
			try
			{
				localPort = 8888;
				remotePort = 8888;
				remoteIPAddress = IPAddress.Parse("192.168.1.77");

				// Создаем поток для прослушивания
				Thread tRec = new Thread(new ThreadStart(Receiver));
				tRec.Start();
				int d=0;
				while (true)
				{
					d++;

					if (d==10){
						post();
						d = 0;
					}
					Send("a");
					Thread.Sleep(10000);
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine("Возникло исключение: " + ex.ToString() + "\n  " + ex.Message);
			}
		}

		private static void Send(string datagram)
		{
			// Создаем UdpClient
			UdpClient sender = new UdpClient();

			// Создаем endPoint по информации об удаленном хосте
			IPEndPoint endPoint = new IPEndPoint(remoteIPAddress, remotePort);
			timepost(10000);

			try
			{
				// Преобразуем данные в массив байтов
				byte[] bytes = Encoding.UTF8.GetBytes(datagram);
				// Отправляем данные
				sender.Send(bytes, bytes.Length, endPoint);
			}
			catch (Exception ex)
			{
				Console.WriteLine("Возникло исключение: " + ex.ToString() + "\n  " + ex.Message);
			}
			finally
			{
				// Закрыть соединение
				sender.Close();
			}
		}
		
		public static void timepost(int millis){
			try{
				WebRequest request = WebRequest.Create ("http://localhost:8553/setAverageTime");
				request.Method = "POST";
				byte[] byteArray = Encoding.UTF8.GetBytes (millis.ToString());
				Console.WriteLine(millis.ToString());
				request.ContentType = "text/html";
				request.ContentLength = byteArray.Length;
				Stream dataStream = request.GetRequestStream ();
				dataStream.Write (byteArray, 0, byteArray.Length);
				dataStream.Close ();
			}
			catch(WebException){
			}
			catch(SocketException){
			}
			try{
				WebRequest request = WebRequest.Create ("http://62.84.116.86:8553/setAverageTime");
				request.Method = "POST";
				byte[] byteArray = Encoding.UTF8.GetBytes (millis.ToString());
				request.ContentType = "text/html";
				request.ContentLength = byteArray.Length;
				Stream dataStream = request.GetRequestStream ();
				dataStream.Write (byteArray, 0, byteArray.Length);
				dataStream.Close ();
			}
			catch(WebException){
			}
			catch(SocketException){
			}
		}
		public static void post(){
			{
				try{
				WebRequest request = WebRequest.Create ("http://localhost:8553/setData");
				request.Method = "POST";
				string path = @"c:\temp\" + DateTime.Today.ToString () + ".csv";
				path = path.Replace (" 0:00:00", "");
				string data = File.ReadAllText (path);
				byte[] byteArray = Encoding.UTF8.GetBytes (data);
				request.ContentLength = data.Length;
				request.ContentType = "text/html";
				Stream dataStream = request.GetRequestStream ();
				dataStream.Write (byteArray, 0, byteArray.Length);
				dataStream.Close ();
			}
				catch(WebException){
				}
				catch(SocketException){
				}
			}
			{
				try{
				WebRequest request = WebRequest.Create ("http://62.84.116.86:8553/setData");
				request.Method = "POST";
				string path = @"c:\temp\" + DateTime.Today.ToString () + ".csv";
				path = path.Replace (" 0:00:00", "");
				string data = File.ReadAllText (path);
				byte[] byteArray = Encoding.UTF8.GetBytes (data);
				request.ContentLength = data.Length;
				request.ContentType = "text/html";
				Stream dataStream = request.GetRequestStream ();
				dataStream.Write (byteArray, 0, byteArray.Length);
				dataStream.Close ();
				}
				catch(SocketException){
				}catch(WebException){
					Console.WriteLine ("Лева не в сети");}
			}
		}
		public static void Receiver()
		{
			// Создаем UdpClient для чтения входящих данных
			UdpClient receivingUdpClient = new UdpClient(localPort);

			IPEndPoint RemoteIpEndPoint = null;

			try
			{
				long oldtime=0;
				long newtime=0;
				int count = 0;
				long summ = 0;
				
				timepost(10000);
				while (true)
				{
					// Ожидание дейтаграммы
					byte[] receiveBytes = receivingUdpClient.Receive(ref RemoteIpEndPoint);
					bool trig = false;
					int val = 0;
					if (oldtime == 0){
						oldtime = DateTime.Now.Ticks/10000; 
					}else if(count == 360){
						newtime = DateTime.Now.Ticks/10000; 
						summ += newtime -oldtime;
						oldtime = DateTime.Now.Ticks/10000; 
						count++;
						timepost(Convert.ToInt32(summ / count));
						count = 0;
						summ = 0;
					}else{
						newtime = DateTime.Now.Ticks/10000; 
						summ += newtime -oldtime;
						oldtime = DateTime.Now.Ticks/10000; 
						count++;
					}
					while(!trig)
					{
						if(receiveBytes[val*3]==0 && receiveBytes[val*3+1]==0 &&receiveBytes[val*3+2]==0){
							trig = true;
							countDevices = receiveBytes[val*3+3];
						}
						val++;
					}

					Console.WriteLine("Количество датчиков: " + countDevices);
					double[] values = new double[countDevices];
					for(int i = 0; i < countDevices;i++){
						double cel = receiveBytes[i*3];
						double drob = receiveBytes[i*3+1];
						double znak = receiveBytes[i*3+2];
						values[i]=cel+drob/100;
						if(znak==0){
							values[i] = values[i] * -1;
						}
						
						Console.WriteLine("Значение с датчика №" + i + ": " + values[i] + " C");
						Console.WriteLine();
					}
					Console.WriteLine();
					Console.WriteLine("---");
					Console.WriteLine();
					string path = @"c:\temp\" + DateTime.Today.ToString() + ".csv";
					path = path.Replace(" 0:00:00", "");
					Console.WriteLine(path);
					for(int i = 0; i < countDevices; i++){
						File.AppendAllText(path, values[i].ToString()+" ;");
					}
					File.AppendAllText(path, "N");
					Thread.Sleep(5);
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine("Возникло исключение: " + ex.ToString() + "\n  " + ex.Message);
			}
		}
	}
}