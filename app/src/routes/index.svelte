<script lang="ts"></script>

<message-container class="mx-auto mt-10 rounded-md grid p-2 ring-1 ring-gray-500 w-[420px]">
	<div class="request-area p-[5px] rounded-sm border border-[#4b2a2a]">
		<div class="message-form flex flex-col items-center">
			<input
				class="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
				type="text"
				placeholder="Type a message"
			/>
			<button> Send Message </button>
		</div>

		<button class="ping-server" data-tid="ping-websocket"> Ping Server </button>
	</div>
	<div class="response-area">
		<h1>WebSocket response</h1>
		<span />
	</div>
</message-container>

<style lang="scss">
	message-container {
		grid-template-columns: 1fr;
		grid-template-rows: repeat(2, 1fr);
		grid-column-gap: 5px;
		grid-row-gap: 0;
		.request-area {
			.message-form {
				input {
					width: 100%;
					border: 1px solid #4b2a2a;
					border-radius: 4px;
					color: black;
				}
			}
			button {
				margin-top: 20px;
				padding: 10px;
				border: 1px solid #837082;
				background-color: #9c8563;
				color: #000;
				width: 100%;
				border-radius: 8px;
				&.ping-server {
					outline: none;
					border: none;
					background-color: #b1acac;
				}
			}
		}
		.response-area {
			border: 1px solid #528a52;
			border-radius: 4px;
			padding: 10px;
			margin-top: 5px;
			max-width: 100%;
			h1 {
				text-decoration: underline;
				text-transform: capitalize;
			}
		}
	}
</style>
