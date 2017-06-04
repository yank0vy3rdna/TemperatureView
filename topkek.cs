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
				while (true)
				{
					Send("a");
					Thread.Sleep(10000);
				}
			}
			catch (Exception)
			{
				Environment.Exit (0);
			}
		}

		private static void Send(string datagram)
		{
			// Создаем UdpClient
			UdpClient sender = new UdpClient();

			// Создаем endPoint по информации об удаленном хосте
			IPEndPoint endPoint = new IPEndPoint(remoteIPAddress, remotePort);
			try
			{
				// Преобразуем данные в массив байтов
				byte[] bytes = Encoding.UTF8.GetBytes(datagram);
				Console.WriteLine("Send data");
				// Отправляем данные
				sender.Send(bytes, bytes.Length, endPoint);
				Console.WriteLine("Sending data");
			}
			catch (Exception)
			{
				Console.WriteLine("Exception!");
				Environment.Exit (0);
			}
			finally
			{
				sender.Close();
			}
		}


		public static void Receiver()
		{
			// Создаем UdpClient для чтения входящих данных
			UdpClient receivingUdpClient = new UdpClient(localPort);

			IPEndPoint RemoteIpEndPoint = null;

			try
			{
				while (true)
				{
					// Ожидание дейтаграммы
					Console.WriteLine("Initializing buffers");
					byte[] receiveBytes = receivingUdpClient.Receive(ref RemoteIpEndPoint);
					bool trig = true;
					int val = 0;
					Console.WriteLine("Buffers initialized");

					Console.WriteLine("Reading Data");
					while(trig)
					{
						if(receiveBytes[val*3]==0 && receiveBytes[val*3+1]==0 &&receiveBytes[val*3+2]==0){
							trig = false;
							countDevices = receiveBytes[val*3+3];
						}
						val++;
					}
					Console.WriteLine("Nice Read");
					Console.WriteLine("Количество датчиков: " + countDevices);
					if (countDevices != 5){
						continue;
					}
					Console.WriteLine("Forming data");
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

					Console.WriteLine("Nice forming");
					Console.WriteLine("Write to file");
					string path = @"c:\temp\" + DateTime.Today.ToString() + ".csv";
					path = path.Replace(" 0:00:00", "");
					Console.WriteLine(path);
					for(int i = 0; i < countDevices; i++){
						File.AppendAllText(path, values[i].ToString()+" ;");
					}
					string time = DateTime.Now.ToString();
					time = time.Replace(" ",".");
					time = time.Remove(time.Length-3,3);
					File.AppendAllText(path, "T" + time+ "TN");
					Console.WriteLine("Nice write to file");
					Thread.Sleep(5);
				}
			}
			catch (Exception)
			{

				Console.WriteLine("Exception!");
				Environment.Exit (0);
			}
		}
	}
}
